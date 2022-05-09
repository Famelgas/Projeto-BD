var script = "";
var ind = 0;


/* https://www.tutorialspoint.com/postgresql/postgresql_using_autoincrement.htm */
var postgresIncrement = {
    'integer': 'serial',
    'bigint': 'bigserial',
    'smallint': 'smallserial'
};

/**
 * Generate DDL script
 */
function generate() {
    try {
        //generate physical diagram (generate_physical.js)
        generate_physical_diagram(2);

        script = "";
        //for each table in the app
        for (var i in physical_tables_list) {
            script += "CREATE TABLE " + prepareWhiteSpace(physical_tables_list[i].data.table_name) + " (\n";
            //identation
            ind++;
            //Generate fields
            generate_fields(physical_tables_list[i].data.fields);
            //Generate primary key
            generate_pks(physical_tables_list[i].data.fields);
			
			if (db_chosen == "SQLite") {
				generate_fks(physical_tables_list[i].data.fields);
			}
			
            ind--;
            indent();
            
            script += ");\n\n";
        }

        //Generate constraints for each table
        for (var i in physical_tables_list) {
			if (db_chosen != "SQLite")
				generate_constraints(physical_tables_list[i].data.table_name, physical_tables_list[i].data.fields);
            generate_check_constraints(physical_tables_list[i]);
        }

        script += "\n";

        for (var i in sequences_tables) {
            generate_create_sequences(sequences_tables[i]);
        }
    } catch (err) {
        call_error_dialog(err, "generate");
    }
}

function generate_fks(fields){
	var g=0;
	script=script.substring(0,script.length-1);
	script+=",\n";
	for (var i =0; i<fields.length; i++){
		if (fields[i].isFK){
			indent();
			g++;
			script+="FOREIGN KEY ("+fields[i].fieldName+") REFERENCES "+fields[i].FKTable+"("+fields[i].FKField+"),\n";
		}
	}
	if(g>0){
	script=script.substring(0,script.length-2);
	script+="\n";}
}
/**
 * Generate sequence.
 * @param sequence
 */
function generate_create_sequences(sequence) {

    var database = $("#dropbtn_title").html();
    script += "CREATE SEQUENCE " + prepareWhiteSpace(sequence.data.table_name) + "\n";
    
    for (var i = 0; i < sequence.data.fields.length; i++) {
        var f = sequence.data.fields[i];
        if (f.fieldName == "Cache") {
            switch (database) {
                case ("Oracle"): {
                    if (f.value && f.value > 1) {
                        script += '\t' + f.fieldName.toUpperCase() + '\t' + f.value + '\n';
                    } else if (f.value === false) {
                        script += '\t' + "NOCACHE\n";
                    }
                    break;
                }
                case ("PostgreSQL"): {
                    if (f.value && f.value > 1) {
                        script += '\t' + f.fieldName.toUpperCase() + '\t' + f.value + '\n';
                    }
                    break;
                }
                case ("MariaDB"): {
                    if (f.value && f.value > 1) {
                        script += '\t' + f.fieldName.toUpperCase() + '\t' + f.value + '\n';
                    } else if (f.value === false) {
                        script += '\t' + "NOCACHE\n";
                    }
                }
            }
        } else if (f.fieldName == "No Cache") {
            switch (database) {
                case ("Oracle"):
                case ("MariaDB"):
                    if (f.value) {
                        script += '\t' + "NOCACHE\n";
                    }
            }
        } else if (f.fieldName == "Cycle") {
            switch (database) {
                case ("Oracle"): {
                    if (!f.value) {
                        script += '\t' + "NOCYCLE\n";
                    } else {
                        script += '\t' + "CYCLE\n";
                    }
                    break;
                }
                case ("PostgreSQL"): {
                    if (!f.value) {
                        script += '\t' + "NO CYCLE\n";
                    } else {
                        script += '\t' + "CYCLE\n";
                    }
                    break;
                }
                    
                case ("MariaDB"): {
                    if (!f.value) {
                        script += '\t' + "NOCYCLE\n";
                    } else {
                        script += '\t' + "CYCLE\n";
                    }
                }   
            }
        } else if (f.value !== "") {
            script += '\t' + f.fieldName.toUpperCase() + '\t' + f.value + '\n';
        }
    }
    script += ";\n";
}

/**
 * Generate check constraint
 * @param table
 */
function generate_check_constraints(table) {
    try {
        for (var x = 0; x < table.data.checkName.length; x++) {
            // Just print if the check is completed, otherwise it is ignored
            if (table.data.checkName[x] != "" && table.data.checkCondition[x] != "") {
                script += "ALTER TABLE " + prepareWhiteSpace(table.data.table_name) + " " +
                    "ADD CONSTRAINT " + table.data.checkName[x] + " " +
                    "CHECK (" + table.data.checkCondition[x] + ");\n";
            }
        }
    } catch (err) {
        call_error_dialog(err, "generate check constraints");
    }
}

/**
 * Generate constraints if there is a foreign key.
 * @param name
 * @param fields
 */
function generate_constraints(name, fields) {
    try {
        var j = 1;
        for (var i in fields) {
            if (fields[i].isFK == true) {
                script += "ALTER TABLE " + prepareWhiteSpace(name) + " " +
                    "ADD CONSTRAINT " + prepareWhiteSpace(name + "_fk" + j) + " " +
                    "FOREIGN KEY (" + prepareWhiteSpace(fields[i].fieldName) + ") " +
                    "REFERENCES " + prepareWhiteSpace(fields[i].FKTable) + "(" +
                    prepareWhiteSpace(fields[i].FKField) + ");\n";
                j += 1;
            }
        }
    } catch (err) {
        call_error_dialog(err, "generate constraints");
    }
}

/**
 * Generate fields
 * @param fields
 */


function generate_fields(fields) {
    var getFieldType = undefined;
    try {
        mx = 0;
        //for each field remove white spaces and turn to lower case and get the field with the max lenght
        for (var i in fields) {
            if (mx < prepareWhiteSpace(fields[i].fieldName).length) {
                mx = prepareWhiteSpace(fields[i].fieldName).length;
            }
        }

        var fieldsLength = fields.length;
        var count = 0;
        for (var i in fields) {
            //for each field get name
            indent();
            script += prepareWhiteSpace(fields[i].fieldName);
            //Ident the field type to align with the other field types, 8 is the number of spaces of the tab
            for (var j = mx - (prepareWhiteSpace(fields[i].fieldName).length); j > 0; j -= 8) {
                script += "\t";
            }
            //add field type
            getFieldType = generate_field_type(fields[i]);
            script += getFieldType;

            var splitArgs = '';
            var splitArgs = undefined;
            var toShow = undefined;
            var flagNoArgsPassed = false;

            // Text type somehow is not writting to the script
            // we'll do it here
            // somehow this fucking thing has a space before text
            if (getFieldType == " TEXT") {
                if (fields[i].args != "") {
                    script += "(" + fields[i].args + ")";
                }
            }

            if (scripts[db_chosen]["script_nargs"][fields[i].fieldType] > 0) {
                script += "(";
                //add arguments of the type

                // getFieldType can have different values because of multiple dbs can be chosen 
                if (getFieldType == " NUMERIC" || getFieldType == " NUMBER" || getFieldType == " numeric") {
                    // check if passed precision and scale args
                    // no args passed if true
                    //alert(fields[i].args);
                    if (fields[i].args == "@@@") {
                        script = script.slice(0, -1); // remove "(" from script
                        flagNoArgsPassed = true;
                    } else {
                        // check if we passed precision
                        splitArgs = "" + fields[i].args;
                        if (splitArgs.indexOf("@@@") === -1) {
                            splitArgs = splitArgs.split(",");
                        } else {
                            splitArgs = splitArgs.split("@@@");
                        }

                        toShow = splitArgs;

                        for (var j = 0; j < scripts[db_chosen]["script_nargs"][fields[i].fieldType] - 1; j++) {

                            // we passed precision and scale
                            if (toShow[j] != "" && toShow[j+1] != "") {
                                script += toShow[j] + "," + toShow[j+1] + ")";
                            } else if (toShow[j] != "" && toShow[j+1] == "") {
                                script += toShow[j] + ",0)";
                            } else if (toShow[j] == "" && toShow[j+1] != "") {
                                script += "0," + toShow[j+1] + ")";
                            } 
                            break;
                        }
                    }

                } else {
                    
                    if (fields[i].args == "") {
                        script = script.slice(0, -1); // remove "(" from script
                        flagNoArgsPassed = true;
                    }
                    
                    if (!flagNoArgsPassed) {

                        for (var j = 0; j < scripts[db_chosen]["script_nargs"][fields[i].fieldType] - 1; j++) {
                            script += fields[i].args + ",";
                        }
                        script += fields[i].args + ")";
                    }
                }
            }
            if (fields[i].isUnique == true) {
                script += " UNIQUE";
            }
            if (fields[i].isNotNull == true) {
                script += " NOT NULL";
            }
            if (fields[i].isAutoIncrement) {
                script += generate_auto_increment();
            }

            if (fields[i].defaultValue != "") {
                // in MariaDB this types must be in quotes otherwise it throws error
                if (db_chosen == "MariaDB" && ( getFieldType == " DATE"
                    || getFieldType == " TIMESTAMP"
                    || getFieldType == " CHAR"
                    || getFieldType == " VARCHAR")) {
                    script += " DEFAULT '" + fields[i].defaultValue + "'"; // notice the quotes here

                } else {
                    script += " DEFAULT " + fields[i].defaultValue + "";
                }
            }
            /*
             if(fields[i].isFK == true){
             script += " references \""+fields[i].FKTable+"\"(\""+
             fields[i].FKField+"\")";
             }
             */
            count++;
            if (count != fieldsLength) {
                script += ",\n";
            }
        }
    } catch (err) {
        call_error_dialog(err, "generate_fields");
    }
}

/**
 * Generate field type
 * @param field
 * @returns {string}
 */
function generate_field_type(field) {

    var field_type = scripts[db_chosen]["script_types"][field.fieldType];

    if (isIntegerField(field_type) && $("#dropbtn_title").html() == 'PostgreSQL' && field.isAutoIncrement) {
        return " " + postgresIncrement[field_type.toLowerCase()];
    }

    return " " + field_type;
}

//http://www.oracle.com/technetwork/issue-archive/2013/13-sep/o53asktom-1999186.html
/**
 * Generate auto increment
 * @param field
 * @returns {*}
 */
function generate_auto_increment(field) {
    if (db_chosen == "MySQL") {
        return " AUTO_INCREMENT";
    } else if (db_chosen == "Oracle") {
        return " GENERATED ALWAYS AS IDENTITY";
    }

    return "";
}

/**
 * Generate primary keys
 * @param fields
 */
function generate_pks(fields) {
    try {
        //find primary key
        for (var j = fields.length - 1; j >= 0; j--) {
            if (fields[j].isPK == true) {
                break;
            }
        }
        //if there is no primary key
        if (j == -1) {
            script += "\n";
            return;
        }
        script += ",\n";
        indent();
        script += "PRIMARY KEY(";
        //Verify if ther is another primary key and add it to the script
        for (var i = 0; i < j; i++) {
            if (fields[i].isPK == true) {
                script += prepareWhiteSpace(fields[i].fieldName) + ",";
            }
        }
        script += prepareWhiteSpace(fields[j].fieldName) + ")\n";
    } catch (err) {
        call_error_dialog(err, "generate primary keys");
    }
}
