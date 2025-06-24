<?php

/**
 * Core Framework - FilesEndpoint
 *
 * @license    MIT (https://mit-license.org/)
 * @author     Louis Ouellet <louis@laswitchtech.com>
 */

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Abstracts\Endpoint;

class FilesEndpoint extends Endpoint {

    /**
     * Constructor
     */
    public function __construct()
    {

        // Call Parent Constructor
        parent::__construct();

        // Retrieve the namespace
        $namespace = $this->Request->getNamespace();

        // Set Global access
        $this->Public = false;

        // Set Properties
        switch($namespace){
            case "/files/upload":
                $this->Level = 2;
                break;
            case "/files/archive":
            case "/files/recover":
                $this->Level = 4;
                break;
        }
    }

    /**
     * Upload a File
     *
     * @return array
     */
    public function uploadAction(): array
    {
        // Import Global Variables
        global $CSRF,$UUID;

        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Check the request method
        if($this->Request->getMethod() == "POST"){
            $message["data"]["CSRF"] = [
                "token" => $CSRF->token(),
                "key" => $CSRF->key()
            ];
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "POST"){

                // Retrieve the parameters
                $parameters = $this->Request->getParams('REQUEST');

                // Set Required Fields
                $required = ['content','extension','name','size','type','checksum','targetId','targetTable'];

                // Set Unique Fields
                $unique = ['id','created','modified','owner','organization'];

                // Set Optional Fields
                $optional = ['isPublic','path','icon','force'];

                // Iniitialize the force update
                $force = false;

                // Check if the parameter force is set and filter it as a boolean
                if(isset($parameters['force'])){
                    $force = filter_var($parameters['force'], FILTER_VALIDATE_BOOLEAN);
                    unset($parameters['force']);
                }

                // Check if all required fields are set
                if(count(array_intersect_key(array_flip($required), $parameters)) == count($required)){

                    // Check if checksum is valid
                    if(md5(explode(',', $parameters['content'])[1]) == $parameters['checksum']){

                        // Initialize the Events
                        $message['data']['events'] = [];

                        // Retrieve the user's username and vCard
                        $owner = $this->Auth->user()->username;
                        $organization = $this->Auth->user()->organization()->id;
                        $vCard = $this->Auth->user()->vcard();

                        // Initialize the file
                        $file = [
                            'owner' => $owner,
                            'organization' => $organization,
                        ];

                        // Setup the file
                        foreach($required as $key){
                            if(isset($parameters[$key])){
                                $file[$key] = $parameters[$key];
                            }
                        }
                        foreach($optional as $key){
                            if(isset($parameters[$key])){
                                $file[$key] = $parameters[$key];
                                if($key == 'isPublic'){
                                    $file[$key] = intval($file[$key]);
                                }
                            }
                        }
                        unset($file['content']);
                        if(!isset($file['path'])){
                            $file['path'] = '';
                        }
                        $file['path'] = trim($file['path'],'/');

                        // Retrieve the content and checksum
                        $content = base64_decode(explode(',', $parameters['content'])[1]);
                        $file['checksum'] = md5($content);

                        // Check if a file with the same checksum already exists
                        $existingFile = $this->Model->Files->lookup($file['checksum']);

                        // Create the file in the database
                        $file['id'] = $this->Model->Files->create($file);

                        // Check if the file already exists
                        if(!empty($existingFile)){

                            // Set the file uuid
                            $file['uuid'] = $existingFile['uuid'];
                            $file['path'] = $existingFile['path'];

                            // Update the file in the database
                            $affectedRows = $this->Model->Files->update($file['id'], ['uuid' => $file['uuid'], 'path' => $file['path']]);
                        } else {

                            // Set the file uuid
                            $file['uuid'] = $UUID->toString($file['id'].'-'.$file['checksum']);

                            // Update the file in the database
                            $affectedRows = $this->Model->Files->update($file['id'], ['uuid' => $file['uuid']]);
                        }

                        // Save the file to the filesystem
                        if($force || !$this->Helper->Files->exists($file['path'] . DIRECTORY_SEPARATOR . $file['uuid'])){
                            $this->Helper->Files->save($file['path'] . DIRECTORY_SEPARATOR . $file['uuid'], $content);
                        }

                        // Create the an event
                        $message['data']['events'][] = $this->Model->Event->create($owner, $parameters['targetTable'], $parameters['targetId'], 'File', '<vcard>'.$vCard['id'].':'.$this->Auth->user()->username.'</vcard> has uploaded <file>'.$file['name'].'</file>.');

                        // Retrieve the final file
                        $file = $this->Model->Files->get($file['uuid']);
                        $file['content'] = base64_encode($this->Helper->Files->get($file['path'] . DIRECTORY_SEPARATOR . $file['uuid']));
                        $message['data']['record'] = $file;
                    } else {
                        $message['status'] = 400;
                        $message['message'] = "Bad Request";
                        $message['data']['error'] = "The checksum is invalid.";
                    }
                } else {
                    $message['status'] = 400;
                    $message['message'] = "Bad Request";
                    $message['data']['error'] = "Some required fields are missing [";
                    foreach($required as $key){
                        if(!array_key_exists($key, $parameters)){
                            $message['data']['error'] .= $key.", ";
                        }
                    }
                    $message['data']['error'] = rtrim($message['data']['error'], ", ");
                    $message['data']['error'] .= "]";
                }
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }

        return $message;
    }

    /**
     * Archive a File
     */
    public function archiveAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Retrieve the File
        $file = $this->Model->Files->get($this->Request->getParams('GET','uuid'));

        // Check if the File is accessible
        if(empty($file)){
            $message = ["status" => 404, "message" => "Not Found", "data" => "Could not find the requested file."];
        } else {
            if($file['organization']['id'] != $this->Auth->user()->organization()->id){
                $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this file."];
            }
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "GET"){

                // Update the File
                $affectedRows = $this->Model->Files->update($file['id'], ["isArchived" => 1]);

                // Retrieve the Updated File
                $message["data"]["record"] = $this->Model->Files->get($file['uuid']);
            } else {
                $message = ["status" => 400, "message" => "Bad Request", "data" => "Invalid Request Method"];
            }
        }

        return $message;
    }

    /**
     * Recover a File
     */
    public function recoverAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Retrieve the File
        $file = $this->Model->Files->get($this->Request->getParams('GET','uuid'));

        // Check if the File is accessible
        if(empty($file)){
            $message = ["status" => 404, "message" => "Not Found", "data" => "Could not find the requested file."];
        } else {
            if($file['organization']['id'] != $this->Auth->user()->organization()->id){
                $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this file."];
            }
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "GET"){

                // Update the File
                $affectedRows = $this->Model->Files->update($file['id'], ["isArchived" => 0]);

                // Retrieve the Updated File
                $message["data"]["record"] = $this->Model->Files->get($file['uuid']);
            } else {
                $message = ["status" => 400, "message" => "Bad Request", "data" => "Invalid Request Method"];
            }
        }

        return $message;
    }
}
