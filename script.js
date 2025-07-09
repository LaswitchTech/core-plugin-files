const FilePreviewModal = function(uuid){
    builder.Component(
        "modal",
        null,
        {
            onEnter: true,
            destroy:true,
            icon: "file-earmark",
            title: builder.Locale.get("Preview"),
            cancel: false,
            submit: false,
            size: "xl",
            callback: {},
        },
        function(modal,component){

            // Style the modal
            component.header.addClass('text-bg-primary');
            component.body.addClass('p-0');
            component.footer.remove();

            // Create an iframe
            component.body.iframe = $(document.createElement('iframe')).attr({
                "class": 'w-100 vh-75',
                "style": 'border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;',
                "src": '/files/get?uuid='+uuid,
                "width": '100%',
                "height": '100%',
                "frameborder": '0'
            }).appendTo(component.body);

            // Show the modal
            modal.show();
        }
    );
};
const FileUploadModal = function(list = null, fields = {}, callback = null){
    builder.Component(
        "modal",
        {
            onEnter: false,
            destroy: true,
            icon: "upload",
            title: builder.Locale.get("Upload File"),
            cancel: false,
            submit: true,
            callback: {
                submit: function(element,modal){
                    element.form.submit();
                },
            },
        },
        function(modal,component){

            // Save the component
            const componentModal = component;

            // Style the modal
            component.header.addClass('text-bg-info');
            component.footer.submit.addClass('btn-info').removeClass('btn-link').attr({
                "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
            }).text(builder.Locale.get('Upload'));
            component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-upload me-1').prependTo(component.footer.submit);

            // Create the form
            component.form = builder.Component(
                'form',
                component.body,
                {
                    class:{
                        form: 'row',
                        field: 'col',
                    },
                    callback:{
                        submit: function(form){

                            // Get the values
                            var values = form.val();

                            // Run the file promise
                            values.file.then(fileData => {

                                // Loop through the files
                                for(const [id, file] of Object.entries(fileData)){

                                    // Add some properties
                                    file.isPublic = 1;

                                    // Add default fields
                                    for(const [key, value] of Object.entries(fields)){
                                        file[key] = value;
                                    }

                                    // Generate a md5 checksum
                                    builder.Helper.md5(file.content.split(',')[1],function(checksum){

                                        // Save the checksum
                                        file.checksum = checksum;

                                        // AJAX Request
                                        $.ajax({
                                            url: '/api/files/upload',
                                            headers: {'X-CSRF-Authorization': CSRF_KEY},
                                            type: 'POST',dataType: 'json',
                                            data: file,
                                            success: function(response) {

                                                // Check if the list is an object
                                                if(list){

                                                    // Add the file to the list
                                                    list.add(
                                                        {},
                                                        function(item){

                                                            // Format the file
                                                            FileFormat(item, response.record);
                                                        },
                                                    );
                                                }

                                                // Check if a callback is defined
                                                if(typeof callback === "function"){
                                                    callback(response.record);
                                                }

                                                // Close the modal
                                                modal.hide();
                                            }
                                        });
                                    });
                                }
                            }).catch(error => {
                                console.error('Error reading files:', error);
                            });
                        },
                    },
                },
                function(form,component){

                    // file
                    form.add(
                        {
                            name: 'file',
                            label: builder.Locale.get('Upload'),
                            icon: 'upload',
                            type: 'file',
                        },
                    );

                    // Open the modal
                    modal.show();
                },
            );
        },
    );
};
const FileModalArchive = function(file, item){

    // Create a modal
    builder.Component(
        "modal",
        null,
        {
            onEnter: false,
            destroy: true,
            icon: "archive",
            title: builder.Locale.get("Are you sure you?"),
            body: builder.Locale.get("Your are about to archive this file. Are you sure you want to continue?"),
            cancel: false,
            submit: true,
            callback: {
                submit: function(element,modal){

                    // Create a spinner animate-rotate
                    var spinner = $(document.createElement('div')).attr({
                        "class": "animate-rotate rounded-circle border border-secondary border-4 d-none",
                        "style": "width: 96px; height: 96px; border-top-color: var(--bs-primary)!important;",
                    }).appendTo(element);

                    // Hide the dialog
                    element.dialog.addClass('opacity-0');

                    // Setup a spinner while waiting for the modal to be submitted
                    setTimeout(() => {

                        // Hide the dialog
                        element.dialog.hide();

                        // Add flex to the modal
                        element.addClass('d-flex align-items-center justify-content-center');

                        // Show the spinner
                        spinner.removeClass('d-none');

                        // AJAX Request
                        $.ajax({
                            url: '/api/files/archive?id='+file.id,
                            type: 'GET',dataType: 'json',
                            success: function(response) {

                                // Remove the item from the list
                                item.remove();

                                // Hide the modal
                                modal.hide();
                            }
                        });
                    }, 300);
                },
            },
        },
        function(modal,component){

            // Save the component
            const componentModal = component;

            // Style the modal
            component.header.addClass('text-bg-dark');
            component.footer.submit.addClass('btn-dark').removeClass('btn-link').attr({
                "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
            }).text(builder.Locale.get('Archive'));
            component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-archive me-1').prependTo(component.footer.submit);

            // Open the modal
            modal.show();
        },
    );
};
const FileModalRecover = function(file){

    // Create a modal
    builder.Component(
        "modal",
        null,
        {
            onEnter: false,
            destroy: true,
            icon: "file-earmark-check",
            title: builder.Locale.get("Are you sure you?"),
            body: builder.Locale.get("Your are about to restore this file. Are you sure you want to continue?"),
            cancel: false,
            submit: true,
            callback: {
                submit: function(element,modal){

                    // Create a spinner animate-rotate
                    var spinner = $(document.createElement('div')).attr({
                        "class": "animate-rotate rounded-circle border border-secondary border-4 d-none",
                        "style": "width: 96px; height: 96px; border-top-color: var(--bs-primary)!important;",
                    }).appendTo(element);

                    // Hide the dialog
                    element.dialog.addClass('opacity-0');

                    // Setup a spinner while waiting for the modal to be submitted
                    setTimeout(() => {

                        // Hide the dialog
                        element.dialog.hide();

                        // Add flex to the modal
                        element.addClass('d-flex align-items-center justify-content-center');

                        // Show the spinner
                        spinner.removeClass('d-none');

                        // AJAX Request
                        $.ajax({
                            url: '/api/files/recover?uuid='+file.uuid,
                            type: 'GET',dataType: 'json',
                            success: function(response) {

                                // Hide the modal
                                modal.hide();
                            }
                        });
                    }, 300);
                },
            },
        },
        function(modal,component){

            // Save the component
            const componentModal = component;

            // Style the modal
            component.header.addClass('text-bg-info');
            component.footer.submit.addClass('btn-info').removeClass('btn-link').attr({
                "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
            }).text(builder.Locale.get('Restore'));
            component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-arrow-counterclockwise me-1').prependTo(component.footer.submit);

            // Open the modal
            modal.show();
        },
    );
};
const FileFormat = function(element, file){

    // Save the file inside the element
    element.file = file;

    // Set attributes
    element.attr({
        "data-id": file.id,
        "data-type": "files",
    })

    // Update padding
    element.container.addClass('px-3');
    element.field.removeClass('px-1 py-2 ps-2 pe-0').addClass('p-2');

    // Remove the pointer cursor
    element.removeClass('cursor-pointer').css('transition', '0.5s ease-in-out');

    // Setup a grid
    element.field.container = $(document.createElement('div')).addClass('d-flex justify-content-start align-items-center').appendTo(element.field);
    element.field.container.icon = $(document.createElement('div')).addClass('flex-shrink-1 d-flex justify-content-center align-items-center text-bg-primary rounded-circle border border-3 border-light').css({height:"64px",width:"64px"}).appendTo(element.field.container);
    element.field.container.content = $(document.createElement('div')).addClass('flex-grow-1 d-flex flex-column justify-content-center align-items-start ms-3').appendTo(element.field.container);
    element.field.container.content.line1 = $(document.createElement('div')).addClass('text-nowrap my-1').appendTo(element.field.container.content);
    element.field.container.controls = $(document.createElement('div')).addClass('flex-shrink-1 d-flex justify-content-center align-items-center').appendTo(element.field.container);

    // Add the icon
    element.field.icon = $(document.createElement('i')).addClass('fs-3 bi bi-'+file.icon).appendTo(element.field.container.icon);

    // Add the name
    element.field.name = $(document.createElement('span')).addClass('fs-5 fw-lighter').text(file.name).appendTo(element.field.container.content.line1);

    // Add additonnal styling to the content area
    element.field.container.addClass('cursor-pointer');

    // on hover Add text-bg-secondary to the item
    element.field.container.hover(
        function(){
            element.addClass('text-bg-secondary');
        },
        function(){
            element.removeClass('text-bg-secondary');
        },
    );

    // Open modal when clicking on the file
    element.field.container.icon.click(function(){
        FilePreviewModal(file.uuid);
    });
    element.field.container.content.click(function(){
        FilePreviewModal(file.uuid);
    });

    // Add the actions
    element.field.container.controls.actions = $(document.createElement('div')).addClass('btn-group').appendTo(element.field.container.controls);
    element.field.container.controls.actions.download = $(document.createElement('button')).addClass('btn btn-sm btn-light').html('<i class="bi me-1 bi-download"></i>'+builder.Locale.get("Download")).appendTo(element.field.container.controls.actions);
    element.field.container.controls.actions.download.click(function(){
        window.location.href = '/files/get?uuid='+file.uuid+'&download';
    });
    element.field.container.controls.actions.archive = $(document.createElement('button')).addClass('btn btn-sm btn-dark').html('<i class="bi bi-archive"></i>').appendTo(element.field.container.controls.actions);
    element.field.container.controls.actions.archive.click(function(){
        FileModalArchive(file, element);
    });

    // Remove the icon and the actions container
    setTimeout(() => {
        if(typeof element.container.icon !== 'undefined'){
            element.container.icon.remove();
        }
        if(typeof element.field !== 'undefined'){
            element.field.removeClass('px-1 py-2 ps-2 pe-0').addClass('p-2');
        }
        if(typeof element.actions !== 'undefined'){
            element.actions.remove();
        }
    }, 100);
};
const FilesFeed = function(files, container, defaults = {}, callback = null){

    // Initialize the list's tools and actions
    var Tools = {
        add: {
            icon: "plus-lg",
            label: builder.Locale.get("Upload a file..."),
            color: "success",
            callback: function(tool,list){
                FileUploadModal(list, defaults);
            },
        },
    };
    var Actions = {}

    // Get the keys as numbers, sort them in reverse order
    const sortedKeys = Object.keys(files).map(Number).sort((a, b) => b - a);

    // Create the list
    builder.Component(
        "list",
        container,
        {
            class: {
                component: "w-100 rounded bg-transparent border-0 shadow-none",
                item: "rounded-top-0",
            },
            tools: Tools,
            actions: Actions,
        },
        function(list,component){

            // Loop through the files
            for(const [key, id] of Object.entries(sortedKeys)){
                const file = files[id];

                // Add the file to the list
                list.add(
                    {},
                    function(item,list){

                        // Format the file
                        FileFormat(item, file);
                    },
                );
            }
        },
    );
};

// Upload a file
function process_function_FileUpload(task, value, callback = null){

    // Open the Upload modal
    FileUploadModal(null,{isPublic:1,targetTable:task.targetTable,targetId:task.targetId},function(response){

        // Execute Callback
        if(typeof callback === "function"){
            callback(task, response);
        }
    });
}
function process_meta_FileUpload(key = null){
    const metadata = {
        label: "Upload a File",
        description: "Upload a File",
        type: "none",
    };
    return metadata[key] ? metadata[key] : metadata;
}
