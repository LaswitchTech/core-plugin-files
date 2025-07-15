<?php

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Abstracts\Helper;

class FilesHelper extends Helper {

    // Properties
    private $Path;

    /**
     * Constructor
     */
    public function __construct()
    {
        // Import Global Variables
        global $CONFIG;

        // Set Properties
        $this->Path = $CONFIG->root() . DIRECTORY_SEPARATOR . 'data';
    }

    /**
     * Save a file
     *
     * @param string $path
     * @param string $content
     * @return string
     */
    public function save(string $path, string $content): bool
    {
        // Check if the directory exists
        if (!is_dir(dirname($this->Path . DIRECTORY_SEPARATOR . $path))) {
            mkdir(dirname($this->Path . DIRECTORY_SEPARATOR . $path), 0755, true);
        }
        // Save the file
        return file_put_contents($this->Path . DIRECTORY_SEPARATOR . $path, $content) !== false;
    }

    /**
     * Check if a file exists
     *
     * @param string $path
     * @return bool
     */
    public function exists(string $path): bool
    {
        // Check if the file exists
        return file_exists($this->Path . DIRECTORY_SEPARATOR . $path);
    }

    /**
     * Get a file
     *
     * @param string $path
     * @return string
     */
    public function get(string $path): string
    {
        if($this->exists($path)) {
            return file_get_contents($this->Path . DIRECTORY_SEPARATOR . $path);
        }
        return '';
    }
}
