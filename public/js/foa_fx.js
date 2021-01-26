//////////////////////////////////////////////////////////////////////////////////////////
// global variables
//////////////////////////////////////////////////////////////////////////////////////////

//alert('opened foa_fx.js');

const pageScholarshipVolume = 15; // number of scholarships to be displayed on a page
const pageSponsorVolume = 15; // number of sponsors to be displayed on a page

//alert('pageScholarshipVolume: ' + pageScholarshipVolume);

$(document).ready(function(){
    $('#birth-date').mask('00/00/0000');
    $('#phone-number').mask('0000-0000');
    $('#filterAgeInput').mask('00');
  });

//////////////////////////////////////////////////////////////////////////////////////////
 // load the options into a SELECT element
//////////////////////////////////////////////////////////////////////////////////////////
function loadSelectOptionsList(selectEl, notSelectedText, notSelectedValue, optionsArr, selectedValue = '') {

    // get a reference to the SELECT element
    const selectElement = document.querySelector("#" + selectEl);
    
    // create and add the "(Not Selected)" default option
    const optNotSelected = document.createElement("option");
    optNotSelected.textContent = notSelectedText;
    optNotSelected.value = notSelectedValue;
    selectElement.appendChild(optNotSelected);
    optNotSelected.selected = true;

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
            };
        };
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
