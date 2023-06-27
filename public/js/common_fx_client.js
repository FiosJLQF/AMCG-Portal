////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Common scripts for all pages (client-side scripts)
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   loadSelectOptionsList
//   toggleBlockShowHide
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////
 // load the options into a SELECT element
//////////////////////////////////////////////////////////////////////////////////////////
function loadSelectOptionsList(selectEl, notSelectedText, notSelectedValue, optionsArr, selectedValue = '') {

    // get a reference to the SELECT element
    const selectElement = document.querySelector("#" + selectEl);

    // create and add the "(Not Selected)" default option, if requested
    if ( notSelectedText != '' && notSelectedValue.toString.length > 0 ) {
        const optNotSelected = document.createElement("option");
        optNotSelected.textContent = notSelectedText;
        optNotSelected.value = notSelectedValue;
        selectElement.appendChild(optNotSelected);
        optNotSelected.selected = true;
    };

    // add options
    optionsArr.forEach( function(option, ind) {
        const optionEl = document.createElement("option");
        optionEl.textContent = option['optiontext'];
        optionEl.value = option['optionid'];
        if (optionEl.value === selectedValue) {
//            alert(`optionEl.value: (${option['optionid']}); selectedValue: (${selectedValue})`);
            optionEl.selected = true;
        };
        optionEl.classList.add('filter-option');
        selectElement.appendChild(optionEl);
    });
    
};


//////////////////////////////////////////////////////////////////////////////////////////
// toggle a block of elements to show/hide, when the icon is clicked
//////////////////////////////////////////////////////////////////////////////////////////
function toggleBlockShowHide(elIcon, elBlock, elInput, statusToSet, upIconName, downIconName) {

    // Get the current style properties for the Block
    const cssStyles = window.getComputedStyle(elBlock, null);

    console.log(`Changing block display for ${elBlock.id}.`);
    console.log(`statustoSet: ${statusToSet}`);

    // if the current display is hidden and the forced statusToSet <> "hide", then show
    if (statusToSet !== "hide" && cssStyles.getPropertyValue("display") !== "block"
       ) {

        elBlock.style.display = "block";
        elIcon.classList.remove(downIconName);
        elIcon.classList.add(upIconName);

    } else { // current display is set to "show" - clear any element values and hide

        if (elInput !== "") {
            switch (elInput.nodeName.toLowerCase()) {
                case "input":
                    elInput.value = "";
                    break;
                case "select":
                    elInput.value = 0;
                    break;
               default:
                elInput.value = "";
            }
        }

        elBlock.style.display = "none";
        elIcon.classList.remove(upIconName);
        elIcon.classList.add(downIconName);

    };

};
