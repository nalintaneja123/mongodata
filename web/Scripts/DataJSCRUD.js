﻿//ODATA EntitySet URI
var ZIPS_ODATA_SVC;

//Zip edit form Variables
var _id = $("#_id"),
    zipcode = $("#zipcode"),
    city = $("#city"),
	geoloc = $("#geoloc"),
	population = $("#population"),
    state = $("#state"),
    allFields = $([]).add(zipcode).add(city).add(geoloc).add(population).add(state),
	tips = $(".validateTips"),
    curPage = 0,
    entriesPerPage = 20,
    totalEntries = 0;

//Page Load Actions

function OnPageLoad() 
{
    ZIPS_ODATA_SVC = window.location.protocol + "//" + window.location.host + "/zipsdb/zips";

    $("#dialog:ui-dialog").dialog("destroy");

    $("#dialog-form").dialog({
        autoOpen: false,
        height: 550,
        width: 450,
        modal: true,
        close: function () {
            allFields.val("").removeClass("ui-state-error");
        }
    });

    $("#create-zip").button()
			.click(OpenCreateZipDialog);

    $("#first-page").button()
            .click(GotoFirstPage);
    $("#prev-page").button()
            .click(GotoPrevPage);
    $("#next-page").button()
            .click(GotoNextPage);
    $("#last-page").button()
            .click(GotoLastPage);

    RefreshPage();    
} 

//Page Events:
function GotoFirstPage()
{
    curPage = 0;
    RefreshPage();
}

function GotoPrevPage()
{
    if (curPage > 0)
        --curPage;
    RefreshPage();
}

function GotoNextPage()
{
    if (curPage < Math.floor((totalEntries - 1) / entriesPerPage))
        curPage++;
    RefreshPage();
}

function GotoLastPage()
{
    curPage = Math.floor((totalEntries - 1) / entriesPerPage);
    RefreshPage();
}

//***********************Get Zips and Refresh (READ)***************************
//Gets entries from service and updates page
function RefreshPage() 
{
    $("#loadingZips").show();
    OData.read(ZIPS_ODATA_SVC + '/$count?t=' + new Date().getTime().toString(), GetCountCallback);
}

function GetCountCallback(data, request)
{
    totalEntries = parseInt(data);
    if (totalEntries == 0)
        totalEntries = 1;
    if (curPage < 0)
        curPage = 0;
    if (curPage > Math.floor((totalEntries - 1) / entriesPerPage))
        curPage = Math.floor((totalEntries - 1) / entriesPerPage);

    OData.read(ZIPS_ODATA_SVC + '?$top=' + entriesPerPage + '&$skip=' + (curPage * entriesPerPage) + '&t=' + new Date().getTime().toString(), GetEntriesCallback);
}

//GetEntries Success Callback
function GetEntriesCallback(data, request) 
{
    $("#loadingZips").hide();
    $("#zips").find("tr:gt(0)").remove();
    ApplyTemplate(data.results);
}

//***********************End: Get Zips***************************

//*****************************Add Zip (CREATE)***************************
//Handle Create Zip button click
function OpenCreateZipDialog() 
{
    $("#dialog-form").dialog("option", "title", "Create A Zip Entry");
    $("#dialog-form").dialog("option", "buttons", [
                                                            {
                                                                text: "Save",
                                                                click: function () {
                                                                    var bValid = false;
                                                                    bValid = ValidateZipData();
                                                                    if (bValid) {
                                                                        AddZip();
                                                                    }
                                                                }
                                                            },
                                                            {
                                                                text: "Cancel",
                                                                click: function () {
                                                                    $("#dialog-form").dialog("close");
                                                                }
                                                            }
                                                        ]
                                    );
    
    $("#_id").val('');
    $("#zipcode").val('');
    $("#city").val('');
    $("#geoloc1").val('');
    $("#geoloc2").val('');
    $("#population").val('');
    $("#state").val('');

    $("#dialog-form").dialog("open");
}

//Handle the DataJS call for new zip creation
function AddZip() 
{
    $("#loading").show();

    var newZipdata = 
    { 
        zipcode: $("#zipcode").val(), 
        city: $("#city").val(), 
        geoloc: [parseFloat($("#geoloc1").val()), parseFloat($("#geoloc2").val())], 
        population: $("#population").val(), 
        state: $("#state").val() 
    };

    var requestOptions = {
        requestUri: ZIPS_ODATA_SVC,
        method: "POST",
        data: newZipdata
    };

    OData.request(requestOptions, AddSuccessCallback, AddErrorCallback);
}

//AddZip Success Callback
function AddSuccessCallback(data, request) 
{
    $("#loading").hide('slow');
    $("#dialog-form").dialog("close");

    ++totalEntries;
    curPage = Math.floor((totalEntries - 1) / entriesPerPage);
    RefreshPage();
}

//AddZip Error Callback
function AddErrorCallback(error) 
{
    alert("Error : " + error.message)
    $("#dialog-form").dialog("close");
}

//*************************End Add Zip***************************

//*************************Update Zip (UPDATE)***************************
//Handle Update hyper link click
function OpenUpdateDialog(_id) 
{
    $("#loading").hide();

    var cells = $("#zipRow" + _id).children("td");
    $("#zipcode").val(cells.eq(0).text());
    $("#city").val(cells.eq(1).text());

    var geoloc = cells.eq(2).text().split(',');
    $("#geoloc1").val(geoloc[0]);
    $("#geoloc2").val(geoloc[1]);

    $("#population").val(cells.eq(3).text());
    $("#state").val(cells.eq(4).text());

    $("#dialog-form").dialog("option", "title", "Update Zip");

    $("#dialog-form").dialog("option", "buttons", [
                        {
                            text: "Save",
                            click: function () {
                                var bValid = false;
                                bValid = ValidateZipData();
                                if (bValid) {
                                    UpdateZip(_id);
                                }
                            }
                        },
                        {
                            text: "Cancel",
                            click: function () {
                                $("#dialog-form").dialog("close");
                            }
                        }
                    ]);
    $("#dialog-form").dialog("open");
}

//Handle DataJS calls to Update zip data
function UpdateZip(_id) 
{
    $("#loading").show();

    var updateZipdata = 
    {
        _id: _id, 
        zipcode: $("#zipcode").val(),
        city: $("#city").val(), 
        geoloc: [parseFloat($("#geoloc1").val()), parseFloat($("#geoloc2").val())], 
        population: $("#population").val(), 
        state: $("#state").val() 
    };

    var requestURI = ZIPS_ODATA_SVC + "('" + _id + "')";
    var requestOptions = {
        requestUri: requestURI,
        method: "MERGE",
        data: updateZipdata
    };

    OData.request(requestOptions, UpdateSuccessCallback, UpdateErrorCallback);

}

//UpdateZip Suceess callback
function UpdateSuccessCallback(data, request) {
    $("#loading").hide('slow');
    $("#dialog-form").dialog("close");
    RefreshPage();
}

//UpdateZip Error callback
function UpdateErrorCallback(error) {
    alert("Error : " + error.message)
    $("#dialog-form").dialog("close");
}
//*************************End : Update Zip (UPDATE)***************************

//*************************Delete Zip (DELETE)***************************

var $dialog = null;

//Handle Delete hyperlink click
function OpenDeleteDialog(_id) 
{
    $("#loading").hide();
    var cells = $("#zipRow" + _id).children("td");

    $dialog = $('<div></div>')
		            .html('You are about to delete zip "' + cells.eq(0).text() + '". Do you want to continue? ')
		            .dialog({
		                autoOpen: false,
                        width:400,
		                modal: true,
		                buttons: {
		                    "Yes": function () {
		                        DeleteZip(_id);
		                    },
		                    "No": function () {
		                        $(this).dialog("close");
		                    }
		                },
		                title: 'Delete Zip'
		            });
        $dialog.dialog('open');
}

//Handles DataJS calls for delete zip
function DeleteZip(_id) 
{
    var requestURI = ZIPS_ODATA_SVC + "('" + _id + "')";
    var requestOptions = {
                            requestUri: requestURI,
                            method: "DELETE",
                        };

    OData.request(requestOptions, DeleteSuccessCallback, DeleteErrorCallback);
}

//DeleteZip Success callback
function DeleteSuccessCallback()
{
    $dialog.dialog('close');

    --totalEntries;
    curPage = Math.floor((totalEntries - 1) / entriesPerPage);
    RefreshPage();
}

//DeleteZip Error callback
function DeleteErrorCallback(error)
{
    alert(error.message)
}
//*************************End : Delete Zip (DELETE)***************************

//*************************Helper Functions***************************

//Helper function to apply UI template
function ApplyTemplate(data) 
{
    var template = "<tr id=\"zipRow${_id}\">" +
                            "<td>${zipcode}</td>" +
							"<td>${city}</td>" +
							"<td>${geoloc}</td>" +
							"<td>${population}</td>" +
                            "<td>${state}</td>" +
                            "<td>" +
                                "<a href=\"javascript:OpenUpdateDialog('${_id}')\">Update</a>" +
                                " " +
                                "<a href=\"javascript:OpenDeleteDialog('${_id}')\">Delete</a>" +
                            "</td>" +
						"</tr>";

        $.tmpl(template, data).appendTo("#zips tbody");

        if (curPage > 0)
            $("#prev-page").removeAttr('disabled');
        else
            $("#prev-page").attr('disabled','disabled');

        if (curPage < Math.floor((totalEntries - 1) / entriesPerPage))
            $("#next-page").removeAttr('disabled');
        else
            $("#next-page").attr('disabled','disabled');
}

//Validation Helper, validates the zip edit form
function ValidateZipData() 
{
    var bValid = true;
    allFields.removeClass("ui-state-error");

// TODO:
//    bValid = bValid && checkLength(name, "city", 3, 40);
//    bValid = bValid && checkLength(geoloc, "geoloc", 6, 80);
//    bValid = bValid && checkLength(population, "population", 5, 16);
//    bValid = bValid && checkLength(state, "state", 5, 16);

//    bValid = bValid && checkRegexp(name, /^[a-z]([0-9a-z_])+$/i, "Username may consist of a-z, 0-9, underscores, begin with a letter.");
//    bValid = bValid && checkRegexp(email, /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i, "eg. ui@jquery.com");
//    bValid = bValid && checkRegexp(password, /^([0-9a-zA-Z])+$/, "Password field only allow : a-z 0-9");
    return bValid;
}

//Helper function used to show validation errors
function updateTips(t) 
{
    var tips = $(".validateTips");
    tips
				.text(t)
				.addClass("ui-state-highlight");
    setTimeout(function () {
        tips.removeClass("ui-state-highlight", 1500);
    },
                        500);
}

//Helper function to validate length requirements
function checkLength(o, n, min, max) {
    if (o.val().length > max || o.val().length < min) {
        o.addClass("ui-state-error");
        updateTips("Length of " + n + " must be between " +
					min + " and " + max + ".");
        return false;
    }
    else {
        return true;
    }
}

//Helper function to validate using regular expression
function checkRegexp(o, regexp, n) {
    if (!(regexp.test(o.val()))) {
        o.addClass("ui-state-error");
        updateTips(n);
        return false;
    }
    else {
        return true;
    }
}
//*************************End : Helper Functions***************************