function DropdownWithDataPicker(targetListId, initialValue) {

    var rowLimit = 10;
    var dropdownActive = false;
    var currentSelectedItem = -1;
    var data = null;

    var onInputChangedCallback = config.onInputChanged || function (inputValue) { console.log(`Input changed: "${inputValue}"`) }


    function setSelectedItemIndex(indexOfItemToSelect) {

        var previousSelectedItemIndex = currentSelectedItem;
        currentSelectedItem = indexOfItemToSelect;

        showSelectedOption(previousSelectedItemIndex, currentSelectedItem);
    }


    function selectLowerItemInList() {

        var nextSelectedItem = currentSelectedItem;

        if (dropdownActive) {
            if (currentSelectedItem > 0) {
                nextSelectedItem = currentSelectedItem - 1;
            } else {
                nextSelectedItem = data.length - 1;
            }
        }  

        changeOptionSelection(currentSelectedItem, nextSelectedItem);
        currentSelectedItem = nextSelectedItem;  
    }


    function selectUpperItemInList() {

        var nextSelectedItem = currentSelectedItem;

        if (dropdownActive) {
            if (currentSelectedItem < data.length - 1) {
                nextSelectedItem = currentSelectedItem + 1;
            } else {
                nextSelectedItem = 0;
            }
        }  

        changeOptionSelection(currentSelectedItem, nextSelectedItem);
        currentSelectedItem = nextSelectedItem;   
    }


    function changeOptionSelection(previousSelectedOptionIndex, currentSelectedOptionIndex) {

        var dropdownOptions = $('#lookup-dropdown-field .dropdown-options-list').find('.lookup-dropdown-option');
        var previousSelectedOption = dropdownOptions[previousSelectedOptionIndex];
        var currentSelectedOption = dropdownOptions[currentSelectedOptionIndex];

        if (previousSelectedOption) {
            $(previousSelectedOption).removeClass('active');
        }

        if (currentSelectedOption) {
            $(currentSelectedOption).addClass('active');
        }
    }


    function submitOptionSelection(indexOfSelectedItem) {

        var selectedOptionId = data[indexOfSelectedItem].key;
        var selectedOptionValue = data[indexOfSelectedItem].value;

        var $dropdownInput = $('#lookup-dropdown-field .dropdown-data-picker input');

        $dropdownInput.attr('name', selectedOptionId)
        $dropdownInput.val(selectedOptionValue);
    }


    function render() {

        var $dropdownOptionsContainer = $('#lookup-dropdown-field .dropdown-options-container');
        var $dropdownSpinner = $dropdownOptionsContainer.find('.dropdown-spinner');
        var $dropdownOptionsList = $dropdownOptionsContainer.find('.dropdown-options-list');
        var $dropdownError = $dropdownOptionsContainer.find('.dropdown-error-message');

        if (dropdownActive) { 

            $dropdownOptionsContainer.visible = true;
            $dropdownError.visible = false;

            if (data) {
                $dropdownSpinner.visible = false;
                $dropdownOptionsList.html(renderOptionsList(data));
                $dropdownOptionsList.children().each(function() {
                    $(this).on('click', onSelectHandler)
                })
            } else {
                $dropdownSpinner.visible = true;
            }

        } else {
            $dropdownOptionsContainer.visible = false;
        }
    }


    function renderOptionsList(collectionOfItemsToShow) {

        var dropdownOptionsToShow = '';

        collectionOfItemsToShow.map(function (item) {
            var optionToShow = String.format(
                `<li class="lookup-dropdown-option" value=${ item.key }">${ item.value }</li>`
            );
            dropdownOptionsToShow = dropdownOptionsToShow.concat(optionToShow);
        })

        return dropdownOptionsToShow;
    }


    function showErrorMessage(errorMessage) {

        var $dropdownOptionsContainer = $('#lookup-dropdown-field .dropdown-options-container');
        var $dropdownSpinner = $dropdownOptionsContainer.find('.dropdown-spinner');
        var $dropdownError = $dropdownOptionsContainer.find('.dropdown-error-message');

        $dropdownSpinner.visible = false;

        $dropdownError.html(errorMessage);
        $dropdownError.visible = true;
    }


    // Handlers
    function onFocusHandler(event) {
        dropdownActive = true;
    }


    function onInputHandler() {
        
        var inputValue = this.value.trim();
        if (inputValue) {
            onInputChangedCallback(inputValue);
        }

        return;
    }


    function onKeyPressHandler(event) {

        var pressedSymbolCode = 0;

        if (event.which == null) { // IE
            pressedSymbolCode = event.keyCode;
        } else {
            pressedSymbolCode = event.which;
        }
        
        switch (pressedSymbolCode) {
            case 13:
                // TODO: add handler;
                break;
            case 24:
                selectUpperItemInList();
                break;
            case 25:
                selectLowerItemInList();
                break;
        }

        return;
    }


    function onSelectHandler() {

        var listItems = $('#lookup-dropdown-field .dropdown-options-list').find('.lookup-dropdown-option');
        var indexOfSelectedItem = listItems.index(this);

        submitOptionSelection(indexOfSelectedItem);
        return;
    }


    function onBlurHandler() {
        
        dropdownActive = false;
        selectedItemIndex = -1;
    }


    function receiveItemsFromList (targetListId, term) {
        return new Promise(function (resolve, reject) {
            
            SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
    
                var ctx = new SP.ClientContext(_spPageContextInfo.siteAbsoluteUrl);
                var list = ctx.get_web().get_lists().getById(targetListId);
                
                var query = new SP.CamlQuery();
                var queryText = String.format(
                    `<View>
                        <RowLimit>${rowLimit}</RowLimit>
                        <Query>
                            <Where>
                                <BeginsWith>
                                    <FieldRef Name="${lookupListColumnName}"/>
                                    <Value Type="Text">${term}</Value>
                                </BeginsWith>
                            </Where>
                        </Query>
                    </View>`
                );
                query.set_viewXml(queryText);

                var items = list.getItems(query);
                ctx.load(items);
                ctx.executeQueryAsync(function () {            
                    resolve(extractItemsFromCollection(items))
                }, function (sender, args) {
                    console.log(args);
                });
            });
        })
    }


    function renderDropdown() {
        var dropdownDisplayTemlate = '<div id="lookup-dropdown-field">'
                                            '<div class="dropdown-data-picker ms-TextField customer-name-textbox-container">'
                                                '<input type="text" class="ms-TextField-field" name="{0}">{1}</input>'
                                            '</div>'
                                            '<div class="dropdown-options-container">'
                                                '<div class="dropdown-spinner ms-Spinner"></div>'
                                                '<ul class="dropdown-options-list"></ul>'
                                                '<span class="dropdown-error-message ms-formvalidation ms-csrformvalidation">'
                                                    '<span role="alert"></span>'
                                                '</span>'
                                            '</div>'
                                        '</div>';
        if (initialValue) {
            dropdownDisplayTemlate = String.format(
                dropdownDisplayTemlate,
                (initialValue.LookupId === 0 || initialValue.LookupId) ? initialValue.LookupId : '',
                (initialValue.LookupValue) ? initialValue.LookupValue : '' 
            );
        } else {
            dropdownDisplayTemlate = String.format(dropdownDisplayTemlate, '', '');
        }

        return dropdownDisplayTemlate;
    }


    this.showErrorMessage = showErrorMessage.bind(this);
    this.render = render.bind(this);


    document.addEventListener( 'DOMContentLoaded', function () {

        var $dropdownInput = $('#lookup-dropdown-field .dropdown-data-picker input');

        $dropdownInput.on('focus', onFocusHandler);
        $dropdownInput.on('input', onInputHandler);
        $dropdownInput.on('keypress', onKeyPressHandler);
        $dropdownInput.on('blur', onBlurHandler);

    }, false );
  

    var self = {

        getView: function () {
            return `<div id="lookup-dropdown-field">
                        <div class="dropdown-data-picker ms-TextField customer-name-textbox-container">
                            <input class="ms-TextField-field">
                        </div>
                        <div class="dropdown-options-container">
                            <div class="dropdown-spinner ms-Spinner"></div>
                            <ul class="dropdown-options-list"></ul>
                            <span class="dropdown-error-message ms-formvalidation ms-csrformvalidation">
                                <span role="alert"></span>
                            </span>
                        </div>
                    </div>`;
        },

        setData: function (dataToSet) {
            data = dataToSet;
            render();
        },

        showError: this.showErrorMessage,
    }

    return self;
}