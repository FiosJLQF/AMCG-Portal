//////////////////////////////////////////////////////////////////////////////////////////
// global variables
//////////////////////////////////////////////////////////////////////////////////////////

//alert('opened foa_fx.js');

const pageScholarshipVolume = 15; // number of scholarships to be displayed on a page
const pageSponsorVolume = 15; // number of sponsors to be displayed on a page

//alert('pageScholarshipVolume: ' + pageScholarshipVolume);

/*
$(document).ready(function(){
    $('#birth-date').mask('00/00/0000');
    $('#phone-number').mask('0000-0000');
    $('#filterAgeInput').mask('00');
  });
*/

//////////////////////////////////////////////////////////////////////////////////////////
 // load the options into a SELECT element
//////////////////////////////////////////////////////////////////////////////////////////
function loadSelectOptionsList(selectEl, notSelectedText, notSelectedValue, optionsArr, selectedValue = '') {

    // get a reference to the SELECT element
    const selectElement = document.querySelector("#" + selectEl);
    
    // create and add the "(Not Selected)" default option
    if ( notSelectedText.length !== 0 ) {
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
    
}

//////////////////////////////////////////////////////////////////////////////////////////
// toggle the Search Critera input elements, when the icon is clicked
//////////////////////////////////////////////////////////////////////////////////////////
function toggleSearchCriteriaInputBlock(elIcon, elBlock, elInput, statusToSet) {
    // if the current display is hidden and the forced statusToSet <> "hide", then show

    if (statusToSet !== "hide" && elBlock.style.display !== "block") {
        elBlock.style.display = "block";
        elIcon.classList.remove("fa-chevron-down");
        elIcon.classList.add("fa-chevron-up");
    } else {
        // if (elInput !== "") {
        //     switch (elInput.nodeName.toLowerCase()) {
        //         case "input":
        //             elInput.value = "";
        //             break;
        //         case "select":
        //             elInput.value = 0;
        //             break;
        //        default:
        //         elInput.value = "";
        //     };
        // };
        elBlock.style.display = "none";
        elIcon.classList.remove("fa-chevron-up");
        elIcon.classList.add("fa-chevron-down");
    }
}

//////////////////////////////////////////////////////////////////////////////////////////
// toggle the Advanced Search Critera input elements, when the icon is clicked
//////////////////////////////////////////////////////////////////////////////////////////
function toggleAdvancedSearchCriteriaInputBlock(elIcon, elBlock, elInput, statusToSet) {
    // if the current display is hidden and the forced statusToSet <> "hide", then show
    if (statusToSet !== "hide" && elBlock.style.display !== "block") {
        elBlock.style.display = "block";
        elIcon.classList.remove("fa-angle-double-down");
        elIcon.classList.add("fa-angle-double-up");
    } else {
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
        elIcon.classList.remove("fa-angle-double-up");
        elIcon.classList.add("fa-angle-double-down");
    }
}

/*
//////////////////////////////////////////////////////////////////////////////////////////
// does the user have permission to access the page?
//////////////////////////////////////////////////////////////////////////////////////////
function userPermissions(permissionsList, userID, objectName, objectValue = '') {

// ToDo:  database call here with specifics to return T/F instead of this???

    // for each Permission in the Permissions List, is there a match to the current request?
    for (let permission of permissionsList) {
        console.log(permission.userid);
        console.log(permission.objectName);
        console.log(permission.objectValue);
        console.log(permission.canCreate);
        console.log(permission.canRead);
        console.log(permission.canUpdate);
        console.log(permission.canDelete);
    };

}
*/