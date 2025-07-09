<?php

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Base\BaseEndpoint;

class FilesEndpoint extends BaseEndpoint {

    /**
     * Constructor
     */
    public function __construct()
    {
        // Call the parent constructor
        parent::__construct();

        // Initialize the Endpoint
        $this->init('files');

        // Set Properties
        $this->required = ['content','extension','name','size','type','checksum','targetId','targetTable'];

        switch($this->Request->getNamespace()){
            case "/files/upload":
                $this->Level = 2;
                break;
        }
    }

    /**
     * Create a record
     */
    public function createAction(): array
    {
        // Import Global Classes
        global $UUID;

        // Call the parent constructor
        $message = parent::createAction();

        // Check if the record is accessible
        if($message['status'] == 200){

            // Retrieve the parameters
            $parameters = $message['data']['parameters'];

            // Initialize the fields array
            $fields = [];

            // Iniitialize the force update
            $force = false;

            // Check if the parameter force is set and filter it as a boolean
            if(isset($parameters['force'])){
                $force = filter_var($parameters['force'], FILTER_VALIDATE_BOOLEAN);
                unset($parameters['force']);
            }

            // Check if checksum is valid
            if(md5(explode(',', $parameters['content'])[1]) == $parameters['checksum']){

                // Sanitize the path
                $fields['path'] = trim($parameters['path'] ?? '', '/');

                // Retrieve the content and checksum
                $content = base64_decode(explode(',', $parameters['content'])[1]);
                $fields['checksum'] = md5($content);

                // Check if a file with the same checksum already exists
                $file = $this->Model->Files->fetchByChecksum($fields['checksum']);

                // Check if the file already exists
                if(!empty($file)){

                    // Set the file uuid
                    $fields['uuid'] = $file['uuid'];
                    $fields['path'] = $file['path'];
                } else {

                    // Set the file uuid
                    $fields['uuid'] = $UUID->toString($message['data']['record']['id'].'-'.$message['data']['record']['checksum']);
                }

                // Save the file to the filesystem if it does not exist or if force is set to true
                if($force || !$this->Helper->Files->exists($fields['path'] . DIRECTORY_SEPARATOR . $fields['uuid'])){
                    $this->Helper->Files->save($fields['path'] . DIRECTORY_SEPARATOR . $fields['uuid'], $content);
                }

                // Check if the Event Plugin is accessible
                if($this->Helper->Core->isInstalled('event')){

                    // Initialize the Events
                    $message['data']['event'] = [];

                    // Setup a new event
                    $event = [
                        'category' => 'File',
                        'message' => 'New File Created by <vcard>'.$this->Auth->user()->vcard['id'].':'.$this->Auth->user()->username.'</vcard>',
                        'icon' => 'circle',
                        'color' => 'secondary',
                        'link' => '/plugin/'.$message['data']['record']['targetTable'].'/details?id='.$message['data']['record']['targetId'],
                        'targetTable' => $message['data']['record']['targetTable'],
                        'targetId' => $message['data']['record']['targetId'],
                    ];

                    // Create the event
                    $message['data']['event'][] = $this->Model->Event->create($event);
                }

                // Check if $fields is empty
                if(!empty($fields)){
                    $affectedRows = $this->Model->Files->update($message['data']['record']['id'], $fields);
                }

                // Retrieve the record
                $message['data']['record'] = $this->Model->Files->fetch($message['data']['record']['id']);
            } else {
                $this->Model->Files->delete($message['data']['record']['id']);
                $message = ["status" => 400, "message" => "Bad Request", "data" => "The checksum is invalid."];
            }
        }

        // Return the message
        return $message;
    }

    /**
     * Update a record
     */
    public function updateAction(): array
    {
        // Call the parent constructor
        $message = parent::updateAction();

        // Check if the record is accessible
        if($message['status'] == 200){

            // Check if the Event Plugin is accessible
            if($this->Helper->Core->isInstalled('event')){

                // Initialize the Events
                $message['data']['event'] = [];

                // Setup a new event
                $event = [
                    'category' => 'File',
                    'message' => 'File Updated by <vcard>'.$this->Auth->user()->vcard['id'].':'.$this->Auth->user()->username.'</vcard>',
                    'icon' => 'circle',
                    'color' => 'secondary',
                    'link' => '/plugin/'.$message['data']['record']['targetTable'].'/details?id='.$message['data']['record']['targetId'],
                    'targetTable' => $message['data']['record']['targetTable'],
                    'targetId' => $message['data']['record']['targetId'],
                ];

                // Create the event
                $message['data']['event'][] = $this->Model->Event->create($event);
            }
        }

        // Return the message
        return $message;
    }

    /**
     * Delete a record
     */
    public function deleteAction(): array
    {
        // Call the parent constructor
        $message = parent::deleteAction();

        // Check if the record is accessible
        if($message['status'] == 200){

            // Check if the Event Plugin is accessible
            if($this->Helper->Core->isInstalled('event')){

                // Initialize the Events
                $message['data']['event'] = [];

                // Setup a new event
                $event = [
                    'category' => 'File',
                    'message' => 'File Deleted by <vcard>'.$this->Auth->user()->vcard['id'].':'.$this->Auth->user()->username.'</vcard>',
                    'icon' => 'circle',
                    'color' => 'secondary',
                    'link' => '/plugin/'.$message['data']['record']['targetTable'].'/details?id='.$message['data']['record']['targetId'],
                    'targetTable' => $message['data']['record']['targetTable'],
                    'targetId' => $message['data']['record']['targetId'],
                ];

                // Create the event
                $message['data']['event'][] = $this->Model->Event->create($event);
            }
        }

        // Return the message
        return $message;
    }

    /**
     * Archive a record
     */
    public function archiveAction(): array
    {
        // Call the parent constructor
        $message = parent::archiveAction();

        // Check if the record is accessible
        if($message['status'] == 200){

            // Check if the Event Plugin is accessible
            if($this->Helper->Core->isInstalled('event')){

                // Initialize the Events
                $message['data']['event'] = [];

                // Setup a new event
                $event = [
                    'category' => 'File',
                    'message' => 'File Archived by <vcard>'.$this->Auth->user()->vcard['id'].':'.$this->Auth->user()->username.'</vcard>',
                    'icon' => 'circle',
                    'color' => 'secondary',
                    'link' => '/plugin/'.$message['data']['record']['targetTable'].'/details?id='.$message['data']['record']['targetId'],
                    'targetTable' => $message['data']['record']['targetTable'],
                    'targetId' => $message['data']['record']['targetId'],
                ];

                // Create the event
                $message['data']['event'][] = $this->Model->Event->create($event);
            }
        }

        // Return the message
        return $message;
    }

    /**
     * Recover a record
     */
    public function recoverAction(): array
    {
        // Call the parent constructor
        $message = parent::recoverAction();

        // Check if the record is accessible
        if($message['status'] == 200){

            // Check if the Event Plugin is accessible
            if($this->Helper->Core->isInstalled('event')){

                // Initialize the Events
                $message['data']['event'] = [];

                // Setup a new event
                $event = [
                    'category' => 'File',
                    'message' => 'File Recovered by <vcard>'.$this->Auth->user()->vcard['id'].':'.$this->Auth->user()->username.'</vcard>',
                    'icon' => 'circle',
                    'color' => 'secondary',
                    'link' => '/plugin/'.$message['data']['record']['targetTable'].'/details?id='.$message['data']['record']['targetId'],
                    'targetTable' => $message['data']['record']['targetTable'],
                    'targetId' => $message['data']['record']['targetId'],
                ];

                // Create the event
                $message['data']['event'][] = $this->Model->Event->create($event);
            }
        }

        // Return the message
        return $message;
    }

    /**
     * Upload a File
     *
     * @return array
     */
    public function uploadAction(): array
    {
        return $this->createAction();
    }
}
