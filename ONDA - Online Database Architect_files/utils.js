//
//
// This file contains auxiliary functions that perform minor actions and are part of other major requirements
//
//

/**
 * The 'delete' and 'backspace' keys of the keyboard can be used for delete tables and relations
 * ESC can also stop the creation of relations (instead of clicking in the cross)
 *
 */


window.onkeyup = function(e) {
    var t = $(e.target);
    if (!t.is("input, textarea,number")) {
        switch (e.keyCode) {
            case 8: // backspace
            case 46: // delete
                if (current_link != null) {
                    remove_link();
                }
                if (current_table != null) {
                    delete_table();
                }
                break;
            case 27: // escape
                if (current_state == 1) {
                    setup_table_relation(new_relation["id"]);
                }
        }
    }
};


/**
 * Show what action is being performed in the 'Status' field.
 * The 'isError' parameter is used when an error message must be shown to the user
 * @param message
 * @param isError
 * @constructor
 */
function LogStatus(message, isError, showStatus = false)
{
    /*try {
        if (!showStatus) {
            //var x = document.getElementById("snackbar");
            var y = $("#status_container");
            y.css("visibility", "visible");
            y.stop().stop(true, true).fadeIn(0).delay(500).fadeOut(ACTION_LOG_FADE_TIME);
            $("#status-bar").text(message); // Update action message
        }
    } catch (err) {
        call_error_dialog(err, "log status");
    }*/


    try {
        var status_bar1 = $("#status-bar1");
        if (isError) {
            $.ionSound.play("Computer_Error");
            alert(message);
        }

        if (!showStatus) {

            var y = $("#status_container");
            y.css("visibility", "visible");
            y.stop().stop(true, true).fadeIn(0).delay(500).fadeOut(ACTION_LOG_FADE_TIME);
            $("#status-bar").text(message); // Update action message


            /*status_bar1.stop(); // Stop current animation, if any
            status_bar1.text(message); // Update action message
            status_bar1.css({
                "opacity": 1
            }); // Set opacity to 1
            
            status_bar1.animate({
                "opacity": 0
            }, ACTION_LOG_FADE_TIME); // Fade out
            
            var status_bar2 = $("#status-bar2");
            
            status_bar2.stop(); // Stop current animation, if any
            status_bar2.text(message); // Update action message
            status_bar2.css({
                "opacity": 1
            }); // Set opacity to 1
            
            status_bar2.animate({
                "opacity": 0
            }, ACTION_LOG_FADE_TIME); // Fade out*/
        }
    } catch (err) {
        call_error_dialog(err, "log status");
    }
}

/**
 * Checks if the name of the current table is being already used in other table.
 * If yes, the text turns red
 */
function check_for_existing_tablename()
{
    try {
        var name_exists = false;
        for (var i = conceptual_tables_list.length - 1; i >= 0; i--) {
            if (conceptual_tables_list[i] == current_table) continue;
            if (conceptual_tables_list[i].data.table_name == current_table.data.table_name) {
                name_exists = true;
                break;
            }
        }
        // If current table name is equal to another table name -> display text in RED
        if (name_exists) {
            $("#table-name-input").attr('style', 'color: red');
        } else {
            $("#table-name-input").attr('style', 'color: black');
        }
    } catch (err) {
        call_error_dialog(err, "check existing tablename");
    }
}

/**
 * Verification and Validation of the fields of all conceptual table.
 * If an error is found, an error message is thrown at the user.
 * @returns {boolean}
 */

var val = undefined;
 
function check_names()
{
    try {
        // Empty names verification
        for (var i = conceptual_tables_list.length - 1; i >= 0; --i) {
            if (conceptual_tables_list[i].data.table_name.length == 0) {
                LogStatus('Error: Entity or field name can not be empty', true);
                return true;
            }
            for (var j = conceptual_tables_list[i].data.fields.length - 1; j >= 0; --j) {
                if (conceptual_tables_list[i].data.fields[j].fieldName.length == 0) {
                    LogStatus('Error: Entity or field name can not be empty', true);
                    return true;
                }
            }
        }

        // Name can only contain letters (a-z,A-Z), numbers(0-9), underscores(_) or spaces
        for (var i = conceptual_tables_list.length - 1; i >= 0; --i) {
            if (/^[a-zA-Z0-9_\ ]+$/.test(conceptual_tables_list[i].data.table_name) == false) {
                LogStatus('Error: Table and field names can only contain letters (a-z,A-Z), numbers(0-9), underscores(_) or spaces', true);

                return true;
            }
            for (var j = conceptual_tables_list[i].data.fields.length - 1; j >= 0; --j) {
                if (/^[a-zA-Z0-9_\ ]+$/.test(conceptual_tables_list[i].data.fields[j].fieldName) == false) {
                    LogStatus('Error: Table and field names can only contain letters (a-z,A-Z), numbers(0-9), underscores(_) or spaces', true);
                    return true;
                }

                // quick check for the maria DB bug
                if (db_chosen == "MariaDB") {
                    var _data = conceptual_tables_list[i].data.fields[j];
         
                    if (_data.fieldType == 10 || _data.fieldType == 11) {
                        if ((_data.isPK || _data.isUnique)) {
                            if (parseInt(_data.args[0]) >= 768) {
                                LogStatus(special_error, true, true);
                                return true;
                            }
                        }
                        if ((_data.isPK || _data.isUnique)) {
                            if (parseInt(_data.args[0]) >= 768 && _data.defaultValue != "") {
                                LogStatus(special_error, true, true);
                                return true;
                            }
                        }
                    }
                }

                var value = field_validation(
                    db_chosen,
                    conceptual_tables_list[i].data.fields[j].fieldType,
                    conceptual_tables_list[i].data.fields[j].defaultValue
                )

                if (!value) {
                    return true;
                } else {
                    continue;
                }
            }
        }
        // Can not have repeated names
        for (var i = conceptual_tables_list.length - 1; i >= 0; --i) {
            for (var j = i - 1; j >= 0; --j) {
                if (conceptual_tables_list[i].data.table_name == conceptual_tables_list[j].data.table_name) {
                    LogStatus("Error: Repeated entity name", true);
                    return true;
                }
            }
            for (var j = conceptual_tables_list[i].data.fields.length - 1; j >= 0; --j) {
                for (var k = j - 1; k >= 0; --k) {
                    if (conceptual_tables_list[i].data.fields[j].fieldName == conceptual_tables_list[i].data.fields[k].fieldName) {
                        LogStatus("Error: Repeated field name in entity", true);
                        return true;
                    }
                }
                for (var x = 0; x < reservedWords.length; x++) {
                    if (conceptual_tables_list[i].data.fields[j].fieldName.toLowerCase() === reservedWords[x].toLowerCase()) {
                        LogStatus("Field name is a reserved word! The word is: " + reservedWords[x], true);
                        //$("#properties_field_"+j).attr('style', 'color: red'); // field red
                        highlight_table(conceptual_tables_list[i]); // Highlight table that has the reserved word
                        return true;
                    }
                }
            }
        }
        return false;
    } catch (err) {
        call_error_dialog(err, "check names");
    }
}

/**
 * Update canvas with new scale
 * @param newscale
 */
function scale_canvas(newscale)
{
    try {
        if (newscale < MIN_SCALE) {
            return; // Scale can't be lower than 0.1
        }
        if (newscale > MAX_SCALE) {
            return; // Scale can't be higher than 2.0
        }
        
        var centerX = paperWidth / 2.0;
        var centerY = paperHeight / 2.0;
        
        var diffX = (centerX - paper.options.origin.x) / scale; // Difference between the center and the paper origin (X) (with scale ponderation)
        var diffY = (centerY - paper.options.origin.y) / scale; // Difference between the center and the paper origin (Y) (with scale ponderation)
        
        paper.setOrigin(0, 0); // Reset paper origin
        paper.scale(newscale, newscale); // Scale paper
        
        scale = newscale; // Update scale value
        
        diffX *= scale; // Update difference (X) by taking the new scale value
        diffY *= scale; // Update difference (Y) by taking the new scale value
        
        paper.setOrigin(paperWidth / 2.0 - diffX, paperHeight / 2.0 - diffY); // Set the new origin = center of screen - necessary difference
        LogStatus("Scale changed to " + (Math.floor(scale * 100) / 100.0));
    } catch (err) {
        call_error_dialog(err, "scale canvas");
    }
}

/**
 * Returns true if the ID parameter belongs to a table.
 * Returns false otherwise.
 * @param ID
 * @returns {boolean}
 */
function isTable(ID)
{
    try {
        for (var i = 0; i < conceptual_tables_list.length; i++) {
            if (conceptual_tables_list[i].shape.id == ID) {
            	return true;
            }
        }
        return false;
    } catch (err) {
        call_error_dialog(err, "is table");
    }
}

/**
 * Returns true if the ID parameter belongs to a table.
 * Returns false otherwise.
 * @param ID
 * @returns {boolean}
 */
function isLink(ID)
{
    try {
        for (var i = 0; i < conceptual_links_list.length; i++) {
            if (conceptual_links_list[i]._link.id == ID) {
                return true;
            }
        }
        return false;
    } catch (err) {
        call_error_dialog(err, "is link");
    }
}

/**
 * Finds a table with a given ID, from a list of old IDs
 * @param id
 * @param oldIDs
 * @returns {null}
 */
function getTableWithIDFromOldIDs(id, oldIDs)
{
    try {
        for (var i = oldIDs.length - 1; i >= 0; i--) {
            if (oldIDs[i] == id) {
                return conceptual_tables_list[i];
            }
        }
        return null;
    } catch (err) {
        call_error_dialog(err, "get table id from old");
    }
}

/**
 * Returns table object that has the ID passed as parameter
 * @param id
 * @returns {null}
 */
function getTableWithID(id)
{	
    try {
    	// Finds a table with a given ID
        for (var i = conceptual_tables_list.length - 1; i >= 0; i--) {
            if (conceptual_tables_list[i].shape.id == id) {
                return conceptual_tables_list[i];
            }
        }
        return null;
    } catch (err) {
        call_error_dialog(err, "get table id");
    }
}

/**
 * Returns true if the field parameter is of the integer type.
 * Returns false otherwise.
 * @param field
 * @returns {boolean}
 */
function isIntegerField(field)
{
	var integerTypesArray = ["integer","bigint","smallint","number"];

	return $.inArray(field.toLowerCase(),integerTypesArray) > -1;
}

/**
 * Returns true if the field parameter is of the numeric type.
 * Returns false otherwise.
 * @param field
 * @returns {boolean}
 */
function isNumeric(field)
{
    var integerTypesArray = [
    	"integer", "bigint", "smallint", "float", "double precision",
    	"long float", "decimal", "number", "short float"
    ];
    
    return $.inArray(field.toLowerCase(), integerTypesArray) > -1;
}

/**
 * Indent code this is in, add the necessary number of tabs
 */
function indent()
{
    try {
        for (var i = 0; i < ind; i++) {
            script += "\t"
        }
    } catch (err) {
        call_error_dialog(err, "indent");
    }
}

function hide_link(link)
{
	link._visible = false;
}

function table_has_pk(table)
{
    for (var f = 0; f < table.data.fields.length; f++) {
        if (table.data.fields[f].isPK) {
        	return true;
        }
    }
    return false;
}

function save_conceptual_fields(tables)
{
    var f = {};
    for (var i = 0; i < tables.length; i++) {
        f[tables[i].shape.id] = tables[i].data.fields;
    }
    return f;
}

function restore_conceptual_fields(tables, fields)
{
    for (var i = 0; i < tables.length; i++) {
    	tables[i].data.fields = fields[tables[i].shape.id];
    }
}

/**
 * When a error occurs shows a window asking if the user wants to save the diagram
 * @param err
 * @param msg
 */
function call_error_dialog(err, msg)
{
    console.log("erro: " + msg);
    console.log(err);
    $("#dialog-confirm").dialog({
        resizable: false,
        height: "auto",
        width: 600,
        modal: true,
        buttons: {
            "Download Diagram": function() {
                Raven.captureException(msg + "||" + err);
                $('#myModal_error').modal('show');
                $(this).dialog("close");
            },
            "Continue without Downloading": function() {
                Raven.captureException(msg + "||" + err);
                $(this).dialog("close");
                location.reload(true)
            }
        }
    });
}

/**
 * Turn string to lower case without white spaces
 * @param str
 * @returns {string}
 */
function prepareWhiteSpace(str)
{
	try {
		return removeWhiteSpace(str).toLowerCase();
	} catch (err) {
		call_error_dialog(err, "prepare white space");
	}
}

/**
 * Remove white space and replace it with underscore
 * @param str
 * @returns {void|string|XML}
 */
function removeWhiteSpace(str)
{
	try {
		return str.replace(/\s+/g, '_');
	} catch (err) {
		call_error_dialog(err, "remove white space");
	}
}

function field_validation(database, fieldType, fieldValue) {

    if (fieldValue == "") {
        return true;
    }

    switch (database) {
        case ("PostgreSQL"): {
            // boolean
            if (fieldType == 0) {
                fieldValue = fieldValue.replace(/\s/g, '');
                var val = fieldValue == "t"
                    || fieldValue == "y"
                    || fieldValue == "yes"
                    || fieldValue == "on"
                    || fieldValue == Number("1")
                    || fieldValue == "f"
                    || fieldValue == "n"
                    || fieldValue == "no"
                    || fieldValue == "off"
                    || fieldValue == Number("0");

                if (!val && !(/^([tT][rR][Uu]|[Ff][Aa][lL][sS])[eE]$/).test(fieldValue)) {
                    LogStatus(p_booleanError,true,true);
                    return false;
                }
                return true;
            } else if (fieldType == 1) {
                if ((Number(fieldValue) < -32768 || Number(fieldValue) > 32767)) {
                    LogStatus(p_smallintError,true,true);
                    return false;
                } 
                return true;
            } else if (fieldType == 2) {
                // integer
                if ((Number(fieldValue) < -2147483648 || Number(fieldValue) > 2147483647)) {
                    LogStatus(p_integerError,true,true);
                    return false;
                } 
                return true;
            } else if (fieldType == 3) {
                // bigint
                if ((Number(fieldValue) < -9223372036854775808 || Number(fieldValue) > 9223372036854775807)) {
                    LogStatus(p_bigintError,true,true);
                    return false;
                } 
                return true;
            } else if (fieldType >= 4 && fieldType <= 6) {
                // float, double, numeric LOL
                var regexp1 = (/^\d+(?:\.\d+)*([eE][+-]?\d+)?$/.test(fieldValue));
                var regexp2 = (/^(?:\.\d+)*([eE][+-]?\d+)?$/.test(fieldValue));
                var regexp3 = (/^(\d+([eE][+-]?\d+)?)$/.test(fieldValue));


                var pp = (fieldType == 4) ? p_floatError : (fieldType == 5) ? p_doubleError : p_numericError;

                if ((!regexp1 && !regexp2 && !regexp3)) {
                    LogStatus(pp, true, true);
                    return false;
                } 
                return true;
            } else if (fieldType == 7) {
                // date
                var regexp1 = ((/^(\w+)\s(\d+)\,\s\d+$/).test(fieldValue));
                var regexp2 = ((/^(\d+)-(\d+)-(\d+)$/).test(fieldValue));
                var regexp3 = ((/^\d+\/\d+\/\d+$/).test(fieldValue));
                var regexp4 = ((/^(\d+)-(\w+)-\d+$/).test(fieldValue));
                var regexp5 = ((/^(\w+ \d+)$/).test(fieldValue));
                var regexp6 = ((/^(\w+)-(\d+)-(\d+)$/).test(fieldValue));
                var regexp7 = ((/^\d{8}$/).test(fieldValue));
                var regexp8 = ((/^\d{6}$/).test(fieldValue));
                var regexp9 = ((/^J\d{7}$/).test(fieldValue));
                var regexp10 =((/^\d+\.\d{3}$/).test(fieldValue));
                var regexp11 =((/^(\w+)\s(\d+),\s(\d+)\s(A|B)C$/).test(fieldValue));

                if (!regexp1 && !regexp2 && !regexp3 && !regexp4 && !regexp5 &&
                    !regexp6 && !regexp7 && !regexp8 && !regexp9 && !regexp10 && !regexp11) {
                    LogStatus(p_dateError, true, true);
                    return false;
                }
                return true;
            } else if (fieldType == 8) {
                // timestamp
                if (!(/^(\d{4})-\d{2}-\d{2}\s\d{2}\:\d{2}\:\d{2}((\+|\-)?\d{2}?)?$/.test(fieldValue))) {
                    LogStatus(p_timestampError,true,true);
                    return false;
                }
                return true;
            } else if (fieldType == 9 || fieldType == 11 || fieldType == 12) {
                // character
                var pp = (fieldType == 9) ? p_charactherError : (fieldType == 11) ? p_textError : p_blobError;
                if (!(/^\w+?$/.test(fieldValue))) {
                    LogStatus(pp,true,true);
                    return false;
                } 
                return true;
            } 
        }

        case ("MySQL"): {
            if (fieldType == 0) {
                var val = fieldValue == Number("1") || fieldValue == Number("0");

                if (!val && !(/^([tT][rR][Uu]|[Ff][Aa][lL][sS])[eE]$/).test(fieldValue)) {
                    LogStatus(m_booleanError,true,true);
                    return false;
                }
                return true;
            } else if (fieldType == 1) {
                if ((Number(fieldValue) < -32768 || Number(fieldValue) > 32767)) {
                    LogStatus(m_smallintError,true,true);
                    return false;
                }
                return true;
            } else if (fieldType == 2) {
                // integer
                if ((Number(fieldValue) < -2147483648 || Number(fieldValue) > 2147483647)) {
                    LogStatus(m_integerError,true,true);
                    return false;
                } 
                return true;
            } else if (fieldType == 3) {
                // bigint
                if ((Number(fieldValue) < -9223372036854775808 || Number(fieldValue) > 9223372036854775807)) {
                    LogStatus(m_bigintError,true,true);
                    return false;
                } 
                return true;
            } else if (fieldType >= 4 && fieldType <= 6) {
                // float, double, numeric LOL
                var regexp1 = (/^\d+(?:\.\d+)*([eE][+-]?\d+)?$/.test(fieldValue));
                var regexp2 = (/^(?:\.\d+)*([eE][+-]?\d+)?$/.test(fieldValue));
                var regexp3 = (/^(\d+([eE][+-]?\d+)?)$/.test(fieldValue));

                var pp = (fieldType == 4) ? p_floatError : (fieldType == 5) ? p_doubleError : p_numericError;

                if ((!regexp1 && !regexp2 && !regexp3)) {
                    LogStatus(pp, true, true);
                    return false;
                } 
                return true;
            } else if (fieldType == 7) {
                // date
                var regexp1 = ((/^(\w+)\s(\d+)\,\s\d+$/).test(fieldValue));
                var regexp2 = ((/^(\d+)-(\d+)-(\d+)$/).test(fieldValue));
                var regexp3 = ((/^\d+\/\d+\/\d+$/).test(fieldValue));
                var regexp4 = ((/^(\d+)-(\w+)-\d+$/).test(fieldValue));
                var regexp5 = ((/^(\w+ \d+)$/).test(fieldValue));
                var regexp6 = ((/^(\w+)-(\d+)-(\d+)$/).test(fieldValue));
                var regexp7 = ((/^\d{8}$/).test(fieldValue));
                var regexp8 = ((/^\d{6}$/).test(fieldValue));
                var regexp9 = ((/^J\d{7}$/).test(fieldValue));
                var regexp10 =((/^\d+\.\d{3}$/).test(fieldValue));
                var regexp11 =((/^(\w+)\s(\d+),\s(\d+)\s(A|B)C$/).test(fieldValue));

                if (!regexp1 && !regexp2 && !regexp3 && !regexp4 && !regexp5 &&
                    !regexp6 && !regexp7 && !regexp8 && !regexp9 && !regexp10 && !regexp11) {
                    LogStatus(p_dateError, true, true);
                    return false;
                } 
                return true;
            } else if (fieldType == 8) {
                // timestamp
                if (!(/^(\d{4})-\d{2}-\d{2}\s\d{2}\:\d{2}\:\d{2}((\+|\-)?\d{2}?)?$/.test(fieldValue))) {
                    LogStatus(p_timestampError,true,true);
                    return false;
                }
                return true;
            } else if (fieldType == 9 || fieldType == 11 || fieldType == 12) {
                // character
                var pp = (fieldType == 9) ? p_charactherError : (fieldType == 11) ? p_textError : p_blobError;
                if (!(/^\w+?$/.test(fieldValue))) {
                    LogStatus(pp,true,true);
                    return false;
                }
                return true;
            } 
        }
        
        case ("MariaDB"): {
            // boolean
            if (fieldType == 0) {
                if (Number.isInteger(Number(fieldValue)) === false && 
                    !(/^([T][R][U]|[F][A][L][S])[E]$/).test(fieldValue)) {
                    LogStatus(ma_booleanError,true,true);
                    return false;
                }
                return true;
            } else if (fieldType == 1) {
                if ((Number(fieldValue) < -32768 || Number(fieldValue) > 32767)) {
                    LogStatus(p_smallintError,true,true);
                    return false;
                } 
                return true;
            } else if (fieldType == 2) {
                // integer
                if ((Number(fieldValue) < -2147483648 || Number(fieldValue) > 2147483647)) {
                    LogStatus(p_integerError,true,true);
                    return false;
                } 
                return true;
            } else if (fieldType == 3) {
                // bigint
                if ((Number(fieldValue) < -9223372036854775808 || Number(fieldValue) > 9223372036854775807)) {
                    LogStatus(p_bigintError,true,true);
                    return false;
                }
                return true;
            } else if (fieldType >= 4 && fieldType <= 6) {
                // float, double, numeric LOL
                var regexp1 = (/^\d+(?:\.\d+)*([eE][+-]?\d+)?$/.test(fieldValue));
                var regexp2 = (/^(?:\.\d+)*([eE][+-]?\d+)?$/.test(fieldValue));
                var regexp3 = (/^(\d+([eE][+-]?\d+)?)$/.test(fieldValue));


                var pp = (fieldType == 4) ? p_floatError : (fieldType == 5) ? p_doubleError : p_numericError;

                if ((!regexp1 && !regexp2 && !regexp3)) {
                    LogStatus(pp, true, true);
                    return false;
                } 
                return true;
            } else if (fieldType == 7) {
                // date
                var regexp1 = ((/^(\w+)\s(\d+)\,\s\d+$/).test(fieldValue));
                var regexp2 = ((/^(\d+)-(\d+)-(\d+)$/).test(fieldValue));
                var regexp3 = ((/^\d+\/\d+\/\d+$/).test(fieldValue));
                var regexp4 = ((/^(\d+)-(\w+)-\d+$/).test(fieldValue));
                var regexp5 = ((/^(\w+ \d+)$/).test(fieldValue));
                var regexp6 = ((/^(\w+)-(\d+)-(\d+)$/).test(fieldValue));
                var regexp7 = ((/^\d{8}$/).test(fieldValue));
                var regexp8 = ((/^\d{6}$/).test(fieldValue));
                var regexp9 = ((/^J\d{7}$/).test(fieldValue));
                var regexp10 =((/^\d+\.\d{3}$/).test(fieldValue));
                var regexp11 =((/^(\w+)\s(\d+),\s(\d+)\s(A|B)C$/).test(fieldValue));

                if (!regexp1 && !regexp2 && !regexp3 && !regexp4 && !regexp5 &&
                    !regexp6 && !regexp7 && !regexp8 && !regexp9 && !regexp10 && !regexp11) {
                    LogStatus(p_dateError, true, true);
                    return false;
                } 
                return true;
            } else if (fieldType == 8) {
                // timestamp
                if (!(/^(\d{4})-\d{2}-\d{2}\s\d{2}\:\d{2}\:\d{2}((\+|\-)?\d{2}?)?$/.test(fieldValue))) {
                    LogStatus(p_timestampError,true,true);
                    return false;
                } 
                return true;
            } else if (fieldType == 9 || fieldType == 11 || fieldType == 12) {
                // character
                var pp = (fieldType == 9) ? p_charactherError : (fieldType == 11) ? p_textError : p_blobError;
                if (!(/^\w+?$/.test(fieldValue))) {
                    LogStatus(pp,true,true);
                    return false;
                }
                return true;
            } 
        }

        case ("Oracle"): {
            // boolean
            if (fieldType == 0) {

                var val = fieldValue == Number("1") || fieldValue == Number("0");

                if (!val) {
                    LogStatus(o_booleanError,true,true);
                    return false;
                }
                return true;
            } else if (fieldType == 1) {
                if ((Number(fieldValue) < -32768 || Number(fieldValue) > 32767)) {
                    LogStatus(o_smallintError,true,true);
                    return false;
                }
                return true;
            } else if (fieldType == 2) {
                // integer
                if ((Number(fieldValue) < -2147483648 || Number(fieldValue) > 2147483647)) {
                    LogStatus(o_integerError,true,true);
                    return false;
                }
                return true;
            } else if (fieldType == 3) {
                // bigint
                if ((Number(fieldValue) < -9223372036854775808 || Number(fieldValue) > 9223372036854775807)) {
                    LogStatus(o_bigintError,true,true);
                    return false;
                }
                return true;
            } else if (fieldType >= 4 && fieldType <= 6) {
                // float, double, numeric LOL
                var regexp1 = (/^\d+(?:\.\d+)*([eE][+-]?\d+)?$/.test(fieldValue));
                var regexp2 = (/^(?:\.\d+)*([eE][+-]?\d+)?$/.test(fieldValue));
                var regexp3 = (/^(\d+([eE][+-]?\d+)?)$/.test(fieldValue));


                var pp = (fieldType == 4) ? o_floatError : (fieldType == 5) ? o_doubleError : o_numericError;

                if ((!regexp1 && !regexp2 && !regexp3)) {
                    LogStatus(pp, true, true);
                    return false;
                }
                return true;
            } else if (fieldType == 7) {
                // date
                var regexp1 = ((/^(\d+)\-(\w+)\-(\d+)$/).test(fieldValue));

                if (!regexp1) {
                    LogStatus(o_dateError, true, true);
                    return false;
                }
                return true;
            } else if (fieldType == 8) {
                // timestamp
                if (!(/^(\d{4})\-\d{2}\-\d{2}\s\d{2}\:\d{2}\:\d{2}$/.test(fieldValue))) {
                    LogStatus(o_timestampError,true,true);
                    return false;
                }
                return true;   
            } else if (fieldType == 9 || fieldType == 11 || fieldType == 12) {
                // character
                var pp = (fieldType == 9) ? o_charactherError : (fieldType == 11) ? o_textError : o_blobError;
                if (!(/^\w+?$/.test(fieldValue))) {
                    LogStatus(pp,true,true);
                    return false;
                }
                return true;
            }
        }

        case ("SQLite"): {
           if (fieldType == 0) {

               var val = fieldValue == Number("1") || fieldValue == Number("0");

               if (!val) {
                   LogStatus(s_booleanError,true,true);
                   return false;
               }
               return true;
           } else if (fieldType == 1) {
               if ((Number(fieldValue) < -32768 || Number(fieldValue) > 32767)) {
                   LogStatus(s_smallintError,true,true);
                   return false;
               }
               return true;
           } else if (fieldType == 2) {
               // integer
               if ((Number(fieldValue) < -2147483648 || Number(fieldValue) > 2147483647)) {
                   LogStatus(s_integerError,true,true);
                   return false;
               }
               return true;
           } else if (fieldType == 3) {
               // bigint
               if ((Number(fieldValue) < -9223372036854775808 || Number(fieldValue) > 9223372036854775807)) {
                   LogStatus(s_bigintError,true,true);
                   return false;
               }
               return true;
           } else if (fieldType >= 4 && fieldType <= 6) {
               // float, double, numeric LOL
               var regexp1 = (/^\d+(?:\.\d+)*([eE][+-]?\d+)?$/.test(fieldValue));
               var regexp2 = (/^(?:\.\d+)*([eE][+-]?\d+)?$/.test(fieldValue));
               var regexp3 = (/^(\d+([eE][+-]?\d+)?)$/.test(fieldValue));

               var pp = (fieldType == 4) ? o_floatError : (fieldType == 5) ? s_doubleError : s_numericError;

               if ((!regexp1 && !regexp2 && !regexp3)) {
                   LogStatus(pp, true, true);
                   return false;
               }
               return true;
           } else if (fieldType == 7) {
               // date
                var regexp1 = ((/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$$/).test(fieldValue));

                if (!regexp1) {
                    LogStatus(s_dateError, true, true);
                    return false;
                } 
                return true;
           } else if (fieldType == 8) {
               // timestamp
               if (!(/^(\d{4})\-\d{2}\-\d{2}\s\d{2}\:\d{2}\:\d{2}$/.test(fieldValue))
                || fieldValue == "CURRENT_TIMESTAMP") {
                   LogStatus(s_timestampError, true, true);
                   return false;
               }
               return true;   
           } else if (fieldType == 9 || fieldType == 11 || fieldType == 12) {
               // character
               var pp = (fieldType == 9) ? s_charactherError : (fieldType == 11) ? s_textError : s_blobError;
               if (!(/^\w+?$/.test(fieldValue))) {
                   LogStatus(pp,true,true);
                   return false;
               }
               return true;
           }
           return true;
        }
    }
}




/*
var types = [
                "Boolean", "SmallInt", "Integer",
                "BigInt", "Float", "Double Precision",
                "Number", "Date", "Timestamp", "Character",
                "Varchar", "Text", "Blob"
            ];
        case ("MySQL"):
        case ("MariaDB"):
        case ("SQLite"):
        case ("Oracle"):


*/
