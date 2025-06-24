<?php

/**
 * Core Framework - FilesModel
 *
 * @license    MIT (https://mit-license.org/)
 * @author     Louis Ouellet <louis@laswitchtech.com>
 */

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Abstracts\Model;

class FilesModel extends Model {

    // Properties
    private $UUID;
    private $Path;

    /**
     * Constructor
     */
    public function __construct()
    {
        // Call the Parent Constructor
        parent::__construct();

        // Import Global Variables
        global $CONFIG, $UUID;

        // Set Properties
        $this->UUID = $UUID;
        $this->Path = $CONFIG->root() . DIRECTORY_SEPARATOR . 'Data';
    }

    /**
     * Create a new file and return the id
     *
     * @param array $data
     * @return int
     */
    public function create(array $data): int
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('files')
            ->insert($data);

        // Execute the Query
        $affectedRows = $Query->execute();

        // Execute the Query
        return $Query->lastId();
    }

    /**
     * Update a file
     *
     * @param int $id
     * @param array $data
     * @return int
     */
    public function update(int $id, array $data): int
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('files')
            ->update($data)
            ->where('id', $id);

        // Execute the Query
        return $Query->execute();
    }

    /**
     * Retrieve file's Details
     *
     * @param string $uuid
     * @return array
     */
    public function get(string $uuid): array
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('files')
            ->select('*')
            ->join('owner', 'users', 'username')
            ->join('organization', 'organizations', 'id')
            ->filter()
            ->where('id', 9999, '<>')
            ->filter()
            ->where('uuid', $uuid)
            ->limit(1);

        // Retrieve the Results
        $result = $Query->result();

        // Return the Results
        return $result[array_key_first($result)] ?? [];
    }

    /**
     * Lookup a file by checksum
     *
     * @param string $checksum
     * @return array
     */
    public function lookup(string $checksum): array
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('files')
            ->select('*')
            ->join('owner', 'users', 'username')
            ->join('organization', 'organizations', 'id')
            ->filter()
            ->where('id', 9999, '<>')
            ->filter()
            ->where('checksum', $checksum)
            ->limit(1);

        // Retrieve the Results
        $result = $Query->result();

        // Return the Results
        return $result[array_key_first($result)] ?? [];
    }
}
