// ############################################################################################ // PostGres Types
// var Postgres_types = {
//   Varchar : {name: "Varchar"},
//   Integer : {name: "Integer"},
//   Boolean : {name: "Boolean"}
// };

//var Postgres_types = ['Character','Varchar','Boolean','Smallint',
//		      'Integer','Bigint','Numeric','Real',
//		      'Double Precision','Date','Timestamp'];

//var Postgres_types_abreviation = ['Chr ','VChr','Bool','SInt',
//				  'Int ','BInt ','Num ','Real',
//				  'DPrc','Date','TStp'];

//var Postgres_script_nargs=[1,1,0,0,
//			   0,0,2,0,
//			   0,0,0];

//var Postgres_nargs_text=[['Length'],['Length'],[],[],[],[],['Precision','Scale'],[],[],[],[]];

//default values for each data type. Empty positions indicate that the type has no default value.

var _dbs_ = ["PostgreSQL","Oracle","MySQL","MariaDB","SQLite"];
var _norm_ = ["Normal","Simplified"];


var defaultValues = ['','','','',['8'],'',['8','2'],'','',['255'],['512'],['512'],''];
/*var Postgres_script_types=['char','varchar','boolean','smallint',
 'integer','bigint','numeric','real',
 'double precision','date','timestamp'];*/

/*var Postgres_types_description = [
 'Fixed-length character string',
 'Variable-length character string',
 'Logical Boolean (true/false)',
 'Signed two-byte integer',
 'Signed four-byte integer',
 'Signed eight-byte integer',
 'Exact numeric of selectable precision',
 'Single precision floating-point number (4 bytes)',
 'Double precision floating-point number (8 bytes)',
 'Calendar date (YYYY-MM-DD)',
 'Date and time (YYYY-MM-DD hh:mm:ss)'
 ]*/

// TODO This is the code needed to import the variable 'data' from 'test.json'. Delete the snippet after using it.
var db_1 = JSON.parse(postgres);
var db_2 = JSON.parse(oracle);
var db_3 = JSON.parse(mysql);
var db_4 = JSON.parse(data);
var db_5 = JSON.parse(MariaDB);
var db_6 = JSON.parse(SQLite);


//merge = merge.concat(merge2);
for (var attrname in db_2) { db_1[attrname] = db_2[attrname]; }
for (var attrname in db_3) { db_1[attrname] = db_3[attrname]; }
for (var attrname in db_4) { db_1[attrname] = db_4[attrname]; }
for (var attrname in db_5) { db_1[attrname] = db_5[attrname]; }
for (var attrname in db_6) { db_1[attrname] = db_6[attrname]; }
//console.log(db_1);



localStorage.setItem('myStorage', JSON.stringify(db_1));

var scripts = JSON.parse(localStorage.getItem('myStorage'));

var db_chosen;

// ############################################################################################ // Field
// Class TableField
/**
 * Define the field types, and assign the field according to the name, data type.
 * @param fieldName - to define the name of field
 * @param fieldType - type os the field according the data type
 * @param isPK      - to define the a Primary key
 * @param isFK      - to define the foreign key
 * @param isAutoIncrement - Define for auto increment´s data type for the field
 * @param isNotNull       - When the data type can not be null
 * @param isUnique        - This value is assigned to fields with non-repetitive values, ie a single value.
 * @param defaultValue    - Default values, this causes the fields to be assigned a default value by default.
 * @param args            - Method argument
 * @constructor           - method to create and initialize new table field
 */
function SQL_Field(fieldName, fieldType, isPK, isFK, isAutoIncrement, isNotNull, isUnique, defaultValue, args) {
    try {
        
        if (isPK === undefined) {
            isPK = false;
        }

        if (isNotNull === undefined) {
            isNotNull = false;
        }

        if (isUnique === undefined) {
            isUnique = false;
        }

        if (defaultValue === undefined) {
            defaultValue = "";
        }

        if (args === undefined) {
            args = [1, 1];
        }

        if (isAutoIncrement === undefined) {
            isAutoIncrement = false;
        }

        this.fieldName = fieldName; // name
        this.fieldType = fieldType; // type
        this.isPK = isPK; // If it is primary key
        this.isNotNull = isNotNull;
        this.isUnique = isUnique;
        this.defaultValue = defaultValue;
        this.args = args;
        this.isAutoIncrement = isAutoIncrement;

    } catch (err) {
        call_error_dialog(err, "sql field");
    }
}
// ############################################################################################ // Table Data
// Contains the table name and an array of fields (of type SQL_Field)
/**
 * function - Sets the type of value that the table can contain
 * @param table_name - for define the name of table
 * @param fields - for define the fields
 * @param checkName - For checking the name of the table
 * @param checkCondition - For checking the condition to used If it complies with the rules for constructing the tables
 * @constructor - Property returns the function constructor for create a new table object
 */
function SQL_Table_data(table_name, fields, checkName, checkCondition) {
    try {
        this.table_name = table_name;
        this.fields = fields;
        this.next_id = 1;
        this.checkName = checkName;
        this.checkCondition = checkCondition;

        if ((this.fields === undefined) || (this.fields === null)) {
        	this.fields = [];
        }

        if ((this.checkName === undefined) || (this.checkName === null)) {
        	this.checkName = [];
        }

        if ((this.checkCondition === undefined) || (this.checkCondition === null)) {
        	this.checkCondition = [];
        }
        
    } catch (err) {
        call_error_dialog(err, "sql table data");
    }
}

// ############################################################################################ // Table (Data + Canvas element)
// Contains the table data and respective canvas element
/**
 * Defines the canvas elements
 * @param rect Parameter to drawing the elements
 * @param shape Parameter to form used by Joint Graph
 * @param data parameter for data type´s table
 * @constructor - Defined by the constructor
 */
function SQL_Table ( rect, shape, data ) {
	try {
		this.rect = rect;                           // Stores the drawn element
		this.shape = shape;                         // Stores the shape used by Graph from Joint.js
		this.data = data;                 			// has type SQL_Table_data
	} catch(err) {
		call_error_dialog(err,"sql table");
	}
}


// ############################################################################################ // Table (Data + Canvas element)
/**
 * Function for the default database change connection
 * @param _source - parameter for table A
 * @param _target - parameter for table B
 * @param _order - for conceptual diagram
 * @param _hierType - for Inheritance Type (simple,concrete,complete)
 * @param _sourceCard - to cardinality of table A (0..1 by default)
 * @param _targetCard - to cardinality of table B (0..1 by default)
 * @param _isSoft
 * @param _link - this is graphic representation of the link
 * @param _label - to relation name
 * @param _sourceisweak - Check if the source of table A is weak
 * @param _targetisweak - Check if the source of table B is weak
 * @constructor -
 *
 *
 */
function SQL_Link ( _source, _target, _order, _hierType, _sourceCard, _targetCard, _isSoft, _link, _label, _sourceisweak, _targetisweak)
{
	try {
		this._source = _source; 		// tabela A
		this._target = _target; 		// tabela B
		this._order = _order;   		// normal/parenting for conceptual diagram
										// Physical/Physical-parenting for physical diagram
		this._hierType = _hierType;		// Inheritance Type (simple,concrete,complete)
		this._sourceCard = _sourceCard; // Cardinality of table A (0..1 by default)
		this._targetCard = _targetCard; // Cardinality of table B (0..1 by default)
		this._isSoft = _isSoft;			// ?
		this._link = _link;				// graphic representation of the link
		this._label = _label;			// relation name

		this._visible = true;

		_sourceisweak == undefined ? this._sourceisweak = false : this._sourceisweak = _sourceisweak;
		_targetisweak == undefined ? this._targetisweak = false : this._targetisweak = _targetisweak;

	} catch(err) {
		call_error_dialog(err,"sql link");
	}
}

// #### Physical Data
/**
 * Defines what type of data fields the physical data model
 * @param fieldName - for define name of model
 * @param fieldType  - parameter for describe the data type of field
 * @param isPK       - parameter for identify the primary key
 * @param isFK       - parameter for identify the foreign key
 * @param FKTable    - define the table of foreign key
 * @param FKField    -  define the field of foreign key
 * @param isNotNull  - Fields can not have empty data, not null
 * @param isUnique   - Fields with unique data, different from other
 * @param defaultValue - Default fields definition
 * @param isAutoIncrement - Parameter define for auto incrementable field on table.
 * @param args -
 * @param used
 * @constructor - method to create and initialize an object
 */
function PH_SQL_Field(fieldName, fieldType, isPK, isFK, FKTable, FKField, isNotNull, isUnique, defaultValue, isAutoIncrement, args, used) {
    try {
        if (isPK === undefined) {
            isPK = false;
        }
        
        if (isFK === undefined) {
            isFK = false;
        }
        
        if (FKTable === undefined) {
            FKTable = null;
        }
        
        if (FKField === undefined) {
            FKField = null;
        }
        
        if (isNotNull === undefined) {
            isNotNull = false;
        }
        
        if (isUnique === undefined) {
            isUnique = false;
        }
        
        if (defaultValue === undefined) {
            defaultValue = "";
        }
        
        if (args === undefined) {
            args = [1, 1];
        }
        
        if (used == undefined) {
            used = false;
        }
        
        if (isAutoIncrement == undefined) {
            isAutoIncrement = false;
        }
        
        this.fieldName = fieldName; // name
        this.fieldType = fieldType; // type
        this.isPK = isPK; // If it is primary key
        this.isFK = isFK;
        this.FKTable = FKTable;
        this.FKField = FKField;
        this.isNotNull = isNotNull;
        this.isUnique = isUnique;
        this.defaultValue = defaultValue;
        this.args = args;
        this.used = used;
        this.isAutoIncrement = isAutoIncrement;
    } catch (err) {
        call_error_dialog(err, "ph sql field");
    }
}

// Setup Joint Shape Properties

joint.shapes.basic.Conceptual_TableElement = joint.shapes.basic.Generic.extend({
	markup: '<g class="rotatable">' +
	'<g class="scalable">' +
    '<rect vector-effect="non-scaling-stroke" class="shape_base" id="shape-base" />' +                          // Shape
    '<line vector-effect="non-scaling-stroke" class="shape_divisor" />' +                       // Line that separates the table name and its fields
    '</g>' +
	'<text id="title" font-family="Ubuntu Mono" />' +                                     // Title
	//'<text  id="fields_pk" />'+                                 // Underlined Fields - PK
	'<text id="fields" font-family="Ubuntu Mono" />' +                                    // Fields
	'<g class="scalable">' +
	'<rect vector-effect="non-scaling-stroke" class="shape_base_aux"/>' + // Layer on top of the shape to allow dragging without problems
    '</g>' +
	'</g>',

	defaults: joint.util.deepSupplement({
	    type: 'basic.Conceptual_TableElement',
	    attrs: {
	        'rect': {
	            width: 100,
	            height: 100,
	            fill: TABLE_COLOR.ENTITY,
	            stroke: "black",
	            "stroke-width": 1
	        },
	        'line': {
	            x1: 0,
	            x2: 100,
	            y1: 50,
	            y2: 50,
	            stroke: "black",
	            "stroke-width": 1
	        },
	        '#title': {
	            'font-size': titleHeight,
	            'ref-x': 0.5,
	            'ref-y': 0.0,
	            ref: 'rect',
	            'y-alignment': 'top',
	            'x-alignment': 'middle',
	            fill: "black",
	            "font-size": 16
	        },
	        '#fields': {
	            'font-size': fieldHeight,
	            'ref-x': 0.02,
	            'ref-y': 0.0,
	            ref: 'rect',
	            'y-alignment': 'top',
	            'x-alignment': 'left',
	            fill: "black",
	            "font-size": 14
	        },
	        '.shape_base_aux': {
	            opacity: 0
	        }
            
	    }
	}, joint.shapes.basic.Generic.prototype.defaults)
});