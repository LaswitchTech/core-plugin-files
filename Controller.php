<?php

/**
 * Core Framework - FilesController
 *
 * @license    MIT (https://mit-license.org/)
 * @author     Louis Ouellet <louis@laswitchtech.com>
 */

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Abstracts\Controller;

class FilesController extends Controller {

    /**
     * Constructor
     */
    public function __construct()
    {

        // Call Parent Constructor
        parent::__construct();

        // Retrieve the namespace
        $namespace = $this->Request->getNamespace();

        // Set Properties
        switch($namespace){
            case "/files/get":
                $this->Public = false;
                $this->Level = 0;
                break;
        }
    }

    /**
     * Get a File
     *
     * @return mixed
     */
    public function getAction(): mixed
    {

        // Retrieve the parameters
        $uuid = $this->Request->getParams('GET', 'uuid') ?? null;

        // Retrieve the file metadata
        $file = $this->Model->Files->get($uuid);

        // Retrieve the file content
        $file['content'] = $this->Helper->Files->get($file['path'] . DIRECTORY_SEPARATOR . $file['uuid']);

        // Return the file
        return $file;
    }
}
