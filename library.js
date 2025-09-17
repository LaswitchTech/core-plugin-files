builder.add('widgets','files', class extends builder.ComponentClass {

    _init(){
        this._properties = {
            class: {
                component: null,
            },
            data: {},
            targetTable: null,
            targetId: null,
            interval: 10000,
            autoStart: false,
            callback: {},
        };
        this._files = {};
        this._selection = [];
        this._counter = 0;
        this._interval = null;
    }

    _create(){

        // Set Self
        const self = this;

        // Create Component
        this._component = $(document.createElement('div')).attr({
            'id': 'files' + this._id,
            'class': 'files-explorer',
        });
        this._component.id = this._component.attr('id');

        // Set Component Class
        if(this._properties.class.component){
            this._component.addClass(this._properties.class.component);
        }

        // Create a controls container
        this._component.controls = $(document.createElement('div')).addClass('files-controls').prependTo(this._component);

        // Create selection controls
        this._component.controls.selection = $(document.createElement('div')).addClass('selection-controls btn-group me-3').appendTo(this._component.controls);
        this._component.controls.selection.selectAll = $(document.createElement('button')).attr({
            'class': 'btn btn-light',
            'data-action': 'select-all',
            'type': 'button',
        }).html('<i class="bi bi-check-square"></i>').appendTo(this._component.controls.selection);
        this._component.controls.selection.selectAll.click(function(){

            // Check if all files are selected
            const allSelected = self._component.container.find('.card').length === self._selection.length

            // If all are selected, deselect all
            if(allSelected){
                self._component.container.find('.card.selected').removeClass('selected');
                self._selection = [];
            } else {
                // Otherwise, select all files
                self._component.container.find('.card:not(.selected)').each(function(){
                    const file = self._files[$(this).data('id')];
                    file.card.addClass('selected');
                    self._selection.push(file.data.id);
                });
            }
            self._component.controls.selection.count.text(self._selection.length + ' ' + self._builder.Locale.get('selected'));
        });
        this._component.controls.selection.count = $(document.createElement('span')).addClass('btn btn-outline-primary counter disabled text-nowrap').html('0' + ' ' + self._builder.Locale.get('selected')).appendTo(this._component.controls.selection);
        this._component.controls.selection.download = $(document.createElement('button')).attr({
            'class': 'btn btn-primary',
            'data-action': 'download',
            'type': 'button',
        }).html('<i class="bi bi-download"></i>').appendTo(this._component.controls.selection);
        this._component.controls.selection.download.click(function(){
            self.download();
        });
        // this._component.controls.selection.share = $(document.createElement('button')).attr({
        //     'class': 'btn btn-light',
        //     'data-action': 'share',
        //     'type': 'button',
        // }).html('<i class="bi bi-share"></i>').appendTo(this._component.controls.selection);
        this._component.controls.selection.archive = $(document.createElement('button')).attr({
            'class': 'btn btn-dark',
            'data-action': 'archive',
            'type': 'button',
        }).html('<i class="bi bi-archive"></i>').appendTo(this._component.controls.selection);
        this._component.controls.selection.archive.click(function(){
            self.archive();
        });

        // Create view controls
        this._component.controls.group = $(document.createElement('div')).addClass('btn-group').appendTo(this._component.controls);
        this._component.controls.group.upload = $(document.createElement('button')).attr({
            'class': 'btn btn-success',
            'data-action': 'upload',
            'type': 'button',
        }).html('<i class="bi bi-upload"></i>').appendTo(this._component.controls.group);
        this._component.controls.group.grid = $(document.createElement('button')).attr({
            'class': 'btn btn-outline-secondary',
            'data-action': 'grid',
            'type': 'button',
        }).html('<i class="bi bi-grid-3x3-gap"></i>').appendTo(this._component.controls.group);
        this._component.controls.group.list = $(document.createElement('button')).attr({
            'class': 'btn btn-outline-secondary',
            'data-action': 'list',
            'type': 'button',
        }).html('<i class="bi bi-list"></i>').appendTo(this._component.controls.group);

        // Create a search container
        this._component.search = $(document.createElement('input')).attr({
            'class': 'form-control',
            'type': 'search',
            'placeholder': this._builder.Locale.get('Search...'),
        }).prependTo(this._component.controls);
        this._component.search.on('input', function(){
            const search = this.value.toLowerCase();
            self._component.container.children('.col').each(function(){
                const content = $(this).text().toLowerCase();
                if(content.includes(search)){
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        });

        // Create a container for the files
        this._component.container = $(document.createElement('div')).addClass('files-container').appendTo(this._component);
        this._component.container.on('click', '.controls, .controls *', function (e) {
            e.stopPropagation();
        });

        // Load the state
        this.loadState();

        // Add Event Listeners
        this._component.controls.group.upload.click(function(){
            self.upload();
        });
        this._component.controls.group.grid.click(function(){

            // Set the grid view
            self._component.container.removeClass('list-view').addClass('grid-view');
            self._component.controls.group.grid.addClass('active');
            self._component.controls.group.list.removeClass('active');

            // Save the state
            self.saveState();
        });
        this._component.controls.group.list.click(function(){

            // Set the list view
            self._component.container.removeClass('grid-view').addClass('list-view');
            self._component.controls.group.list.addClass('active');
            self._component.controls.group.grid.removeClass('active');

            // Save the state
            self.saveState();
        });

        // Add existing Contacts
        for(const [key, record] of Object.entries(this._properties.data ?? {})){
            this.add(record);
        }

        // Check if autoStart is enabled
        if(this._properties.autoStart){

            // Start the interval to check for changes
            setTimeout(function(){
                self.start();
            }, this._properties.interval);
        }
    }

    stateKey() {

        // include origin, path and query so /page?a=1 and /page?a=2 don't clash
        const url = location.origin + location.pathname + location.search;
        return `files.state::${url}::${this._component.id}`;
    }

    clearState() {

        // Remove persisted state
        localStorage.removeItem(this.stateKey());

        // Reset the view mode
        this._component.container.removeClass('list-view').addClass('grid-view');
    }

    saveState() {

        // Save the current view mode
        const state = {
            view: this._component.container.hasClass('list-view') ? 'list' : 'grid',
        };

        // Persist the state
        localStorage.setItem(this.stateKey(), JSON.stringify(state));
    }

    loadState() {

        // Check for persisted state
        const state = localStorage.getItem(this.stateKey());
        if(state){
            try {
                const parsedState = JSON.parse(state);
                if(parsedState.view === 'list'){
                    // Set the list view
                    this._component.container.removeClass('grid-view').addClass('list-view');
                    this._component.controls.group.list.addClass('active');
                    this._component.controls.group.grid.removeClass('active');
                } else {
                    // Set the grid view
                    this._component.container.removeClass('list-view').addClass('grid-view');
                    this._component.controls.group.grid.addClass('active');
                    this._component.controls.group.list.removeClass('active');
                }
            } catch (e) {
                // If parsing fails, default to grid view
                this._component.container.removeClass('list-view').addClass('grid-view');
                this._component.controls.group.grid.addClass('active');
                this._component.controls.group.list.removeClass('active');
            }
        } else {
            // Default to grid view if no state is found
            this._component.container.removeClass('list-view').addClass('grid-view');
            this._component.controls.group.grid.addClass('active');
            this._component.controls.group.list.removeClass('active');
        }
    }

    load(records = null){

        // Set Self
        const self = this;

        // Check if records are provided
        if(records !== null && Object.entries(records).length > 0){

            // Loop through the records
            for(const [key, record] of Object.entries(records)){
                self.add(record);
            }
            return this;
        }

        // Retrieve Notes
        API.endpoint('/files/fetchAll').data({
            conditions: [
                {key: 'targetTable', operator: '=', value: this._properties.targetTable},
                {key: 'targetId', operator: '=', value: this._properties.targetId},
                {key: 'isArchived', operator: '<>', value: 1},
            ]
        }).execute(function(response){
            for(const [key, record] of Object.entries(response.records)){
                self.add(record);
            }
        });

        return this;
    }

    start(){
        // Set Self
        const self = this;

        // Check if the interval is already set
        if(this._interval){
            console.warn('Interval is already set, stopping the previous one.');
            clearInterval(this._interval);
        }

        // Set the interval to check for changes
        this._interval = setInterval(function(){
            self.load();
        }, this._properties.interval);
    }

    stop(){
        // Check if the interval is set
        if(this._interval){
            clearInterval(this._interval);
            this._interval = null;
        } else {
            console.warn('No interval is currently set.');
        }
    }

    add(record, param1 = null, param2 = null){

        // Set Self
        const self = this;

        let options = {};
        let callback = null;

        // Set selector, options, and callback
        [param1, param2].forEach(param => {
            if(param !== null){
                if (typeof param === 'object') {
                    options = param;
                } else if (typeof param === 'function') {
                    callback = param;
                }
            }
        });

        let properties = {
            class: {},
            callback: {},
        };

        // Configure Options
        for(const [key, value] of Object.entries(options)){
            if(typeof properties[key] !== 'undefined'){
                switch(key){
                    case"callback":
                        if(typeof properties[key] !== 'undefined'){
                            for(const [k, v] of Object.entries(value)){
                                if(typeof properties[key][k] !== 'undefined'){
                                    properties[key][k] = v;
                                }
                            }
                        }
                        break;
                    case"class":
                        for(const [section, classes] of Object.entries(value)){
                            if(properties[key][section] != null){
                                properties[key][section] += ' ' + classes;
                            } else {
                                properties[key][section] = classes;
                            }
                        }
                        break;
                    default:
                        properties[key] = value;
                        break;
                }
            }
        }

        // Check if the file already exists
        if(this._files[record.id ?? (this._counter + 1)]){
            return this;
        }

        // Increment Post Count
        this._counter++;

        // Set ID
        const count = record.id ?? this._counter;
        const id = this._component.id + 'file' + count;

        // Create Column
        let file = $(document.createElement('div')).attr({
            'id':id,
            'class':'col',
            'data-type':'file',
        }).appendTo(this._component.container);
        file.id = file.attr('id');
        file.data = record;

        // Create Card
        file.card = $(document.createElement('div')).attr({
            'class': 'card h-100 card-hover',
            'data-id': count,
        }).appendTo(file);
        file.card.body = $(document.createElement('div')).addClass('card-body').appendTo(file.card);

        // Add vCard information
        file.card.body.info = $(document.createElement('div')).addClass('d-flex align-items-center gap-3').appendTo(file.card.body);
        file.card.body.info.icon = $(document.createElement('div')).addClass('file-icon').appendTo(file.card.body.info);
        file.card.body.info.icon.i = $(document.createElement('i')).addClass('bi bi-'+record.icon+' text-'+this.color(record.name)).appendTo(file.card.body.info.icon);
        file.card.body.info.container = $(document.createElement('div')).addClass('file-info flex-grow-1').appendTo(file.card.body.info);
        file.card.body.info.container.name = $(document.createElement('div')).addClass('file-name d-flex align-items-center gap-2 flex-wrap').text(record.name).appendTo(file.card.body.info.container);
        file.card.body.info.container.metadata = $(document.createElement('div')).addClass('small text-secondary').appendTo(file.card.body.info.container);
        file.card.body.info.container.metadata.size = $(document.createElement('span')).addClass('file-size').text(this.humanSize(record.size)).appendTo(file.card.body.info.container.metadata);
        file.card.body.info.container.metadata.date = $(document.createElement('span')).addClass('file-date').text(new Date(record.modified ?? Date.now()).toLocaleDateString()).appendTo(file.card.body.info.container.metadata);

        // Add click event to the card
        file.card.body.click(function(e){
            if ($(e.target).closest('.controls').length) return;
            if(file.card.hasClass('selected')){
                file.card.removeClass('selected');
                self._selection = self._selection.filter(f => f !== file.data.id);
            } else {
                file.card.addClass('selected');
                self._selection.push(file.data.id);
            }
            self._component.controls.selection.count.text(self._selection.length + ' ' + self._builder.Locale.get('selected'));
        });

        // Save the vCard in the contacts object
        this._files[count] = file;

        // return the instance
        return this;
    }

    humanSize(bytes){
        const b = Number(bytes);
        if (isNaN(b) || b < 0) return '—';
        const units = ['B','KB','MB','GB','TB'];
        let i=0, n=b;
        while(n>=1024 && i<units.length-1){ n/=1024; i++; }
        return (Math.round(n*10)/10) + ' ' + units[i];
    }

    color(filename){

        // Get the file extension
        const ext = filename.split('.').pop().toLowerCase();

        // Define a mapping of file extensions to colors
        const colors = {
            'pdf': 'red',
            'doc': 'blue',
            'docx': 'blue',
            'xls': 'green',
            'xlsx': 'green',
            'txt': 'gray',
            'csv': 'gray',
            'html': 'cyan',
            'jpg': 'orange',
            'jpeg': 'orange',
            'png': 'orange',
            'gif': 'orange',
            'svg': 'orange',
            'zip': 'purple',
            'rar': 'purple',
            'mp3': 'pink',
            'wav': 'pink',
            'ogg': 'pink',
            'mp4': 'indigo',
            'avi': 'indigo',
            'mkv': 'indigo',
            'webm': 'indigo',
            // Add more extensions and colors as needed
        };

        // Return the color for the given extension, or a default color
        return colors[ext] || 'gray';
    }

    upload(){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                icon: "upload",
                title: this._builder.Locale.get("Upload file(s)"),
                color: 'success',
            },
            function(modal,component){

                // Set the parent
                const parent = component.dialog;

                // Styling
                component.body.addClass('p-0');

                // Create the Form
                self._builder.Utility(
                    'form',
                    component.body,
                    {
                        callback: {
                            submit: function(form){

                                // Show the modal spinner
                                modal.spinner(true);

                                // Get the values
                                var values = form.val();

                                // Run the file promise
                                values.file.then(fileData => {

                                    // Loop through the files
                                    for(const [key, data] of Object.entries(fileData)){

                                        // Retrieve the first file
                                        var file = data;

                                        // Add some properties
                                        file.checksum = builder.Helper.md5(file.content.split(',')[1]);
                                        file.path = self._properties.targetTable + '/' + self._properties.targetId;
                                        file.isPublic = self._properties.isPublic;
                                        file.targetTable = self._properties.targetTable;
                                        file.targetId = self._properties.targetId;

                                        // AJAX Request
                                        API.endpoint('/files/upload').data(file).execute(function(response){
                                            self.add(response.record);
                                            modal.hide();
                                        },function(){
                                            modal.hide();
                                        });
                                    }
                                }).catch(error => {
                                    console.error('Error reading files:', error);
                                });
                            },
                        }
                    },
                    function(form,component){

                        // Add event listener on the modal submit button
                        parent.content.footer.submit.click(function(e){
                            e.preventDefault();
                            e.stopPropagation();
                            form.submit();
                        });

                        // Upload
                        form.add(
                            'file',
                            {
                                name: 'file',
                                placeholder: self._builder.Locale.get('Select file'),
                                multiple: true,
                                class: {
                                    component: 'bg-gray-200 p-3 py-2 rounded-0',
                                },
                            }
                        );

                        // Show the modal
                        modal.show();
                    },
                );
            },
        );
    }

    archive(){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                icon: "archive",
                title: this._builder.Locale.get("Are you sure?"),
                body: this._builder.Locale.get("You are about to archive the selected file(s). Are you sure you want to continue?"),
                color: 'dark',
                callback: {
                    submit: function(element,modal){

                        // Show the modal spinner
                        modal.spinner(true);

                        // Loop through the selected files
                        for(const [key, id] of Object.entries(self._selection)){
                            const file = self._files[id];

                            // AJAX Request - Archive the file
                            API.endpoint('/files/archive?id='+id).execute(function(response){
                                // Remove the file
                                file.remove();
                                delete self._files[id];

                                // Remove from the selection
                                self._selection = self._selection.filter(f => f !== id);

                                // Update the counter
                                self._component.controls.selection.count.text(self._selection.length + ' ' + self._builder.Locale.get('selected'));

                                // Close the modal
                                if(self._selection.length === 0){
                                    modal.hide();
                                }
                            },function(xhr, status, error){
                                if(self._selection.length === 0){
                                    modal.hide();
                                }
                            });
                        }
                    },
                },
            },
            function(modal,component){

                // Show the modal
                modal.show();
            },
        );
    }

    download(){

        // Set Self
        const self = this;

        // Loop through the selected files
        for(const [key, id] of Object.entries(this._selection)){
            const file = this._files[id];

            // Create a hidden link element
            const link = document.createElement('a');
            link.href = '/files/get?uuid='+file.data.uuid+'&download';
            link.download = file.data.name;
            document.body.appendChild(link);

            // Programmatically click the link to trigger the download
            link.click();

            // Remove the link from the document
            document.body.removeChild(link);
        }
    }
});
