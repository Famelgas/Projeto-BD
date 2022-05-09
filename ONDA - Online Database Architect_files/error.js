////////////////////////////////////
// PostgreSQL
////////////////////////////////////
const p_headerError = '[PostgreSQL Error]: Invalid literal value.';
const p_booleanError = p_headerError + `
Valid literal values for the "true" state are:
\u2022 TRUE
\u2022 t
\u2022 true
\u2022 y
\u2022 yes
\u2022 on
\u2022 1
For the "false" state, the following values can be used:
\u2022 FALSE
\u2022 false
\u2022 f
\u2022 n
\u2022 no
\u2022 off
\u2022 0;
Leading or trailing whitespace is ignored, and case does not matter.
The key words TRUE and FALSE are the preferred (SQL-compliant) usage.`;

const p_smallintError = p_headerError + `\nThe range for smallint is -32768 to +32767.`;
const p_integerError = p_headerError + `\nThe range for integer is -2147483648 to +2147483647.`;
const p_bigintError = p_headerError + `\nThe range for bigint is\n-9223372036854775808 to 9223372036854775807.`;
const p_floatError = p_headerError + `: Float`;
const p_doubleError = p_headerError + `: Double`;
const p_numericError = p_headerError + `: Numeric`;
const p_dateError = p_headerError + `
Examples of possible values for the date type are:
\u2022 1999-01-08   
\u2022 January 8
\u2022 1/8/1999 
\u2022 1/18/1999    
\u2022 01/02/03 
\u2022 1999-Jan-08  
\u2022 Jan-08-1999  
\u2022 08-Jan-1999  
\u2022 99-Jan-08    
\u2022 08-Jan-99    
\u2022 Jan-08-99    
\u2022 19990108 
\u2022 990108 
\u2022 1999.008 
\u2022 J2451187 
\u2022 January 8`;

const p_timestampError = p_headerError + `TimeStamp.
Expected format:
\u2022 YYYY-MM-DD HH:MM:SS (without timezone)
\u2022 YYYY-MM-DD HH:MM:SS:+00 (with timezone)`;

const p_charactherError = p_headerError + `: Characther`;
const p_textError = p_headerError + `: Text`;
const p_blobError = p_headerError + `: Blob`;

////////////////////////////////////
// Oracle
////////////////////////////////////
const o_headerError = `[Oracle Error]: Invalid literal value`;
const o_booleanError = o_headerError + `
Possible values for the boolean type are:
\u2022 1
\u2022 0
Note that this value will be stored as a SMALLINT,
since Oracle doesn't have the boolean datatype.`;

const o_smallintError = o_headerError + `\nThe range for SMALLINT is -32768 to +32767.`;
const o_integerError = o_headerError + `\nThe range for INTEGER is -2147483648 to +2147483647.`;
const o_bigintError = o_headerError + `\nThe range for INTEGER is -9223372036854775808 to 9223372036854775807.`;
const o_floatError = `: Float`;
const o_doubleError = `: Double`;
const o_numericError = `: Numeric`;
const o_dateError = o_headerError + `
Expected format: DD-MON-YY
e.g: (11-NOV-2012)`;

const o_timestampError = o_headerError + `
Excepted format: yyyy-mm-dd hh:mm:ss

e.g: 2017-11-21 15:33:22`;
const o_charactherError = o_headerError + `: Characther`;
const o_varcharError = o_headerError + `: Varchar`;
const o_textError = o_headerError + `: Text`;
const o_blobError = o_headerError + `: Blob`;

////////////////////////////////////
// MySQL
////////////////////////////////////
const m_headerError = '    [MySQL Error]: Invalid literal value';
const m_booleanError = m_headerError + `
    Possible values for the boolean type are:
    \u2022 t
    \u2022 TRUE
    \u2022 FALSE
    \u2022 true
    \u2022 y
    \u2022 yes
    \u2022 on
    \u2022 1
    \u2022 false
    \u2022 f
    \u2022 n
    \u2022 no
    \u2022 off
    \u2022 0;
    Letter case does not matter.`; 

const m_smallintError = m_headerError + `\n    The range for smallint is -32768 to +32767.`;
const m_integerError = m_headerError + `\n    The range for integer is -2147483648 to +2147483647.`;
const m_bigintError = m_headerError + `\n    The range for bigint is\n    -9223372036854775808 to 9223372036854775807.`;
const m_floatError = m_headerError + `: Float`;
const m_doubleError = m_headerError + `: Double`;
const m_numericError = m_headerError + `: Numeric`;
const m_dateError = m_headerError + `
    Examples of possible values for the date type are:
    \u2022 1999-01-08   
    \u2022 January 8
    \u2022 1/8/1999 
    \u2022 1/18/1999    
    \u2022 01/02/03 
    \u2022 1999-Jan-08  
    \u2022 Jan-08-1999  
    \u2022 08-Jan-1999  
    \u2022 99-Jan-08    
    \u2022 08-Jan-99    
    \u2022 Jan-08-99    
    \u2022 19990108 
    \u2022 990108 
    \u2022 1999.008 
    \u2022 J2451187 
    \u2022 January 8`;

const m_timestampError = `TimeStamp.
    Expected format:
    \u2022 YYYY-MM-DD HH:MM:SS        (without timezone)
    \u2022 YYYY-MM-DD HH:MM:SS:+00 (with timezone)`;

const m_varcharError = `Varchar. Invalid length
    Expected argument format:
    \u2022 n, where n is a positive integer`;
    
const m_charactherError = m_headerError + `: Characther`;
const m_textError = m_headerError + `: Text`;
const m_blobError = m_headerError + `: Blob`;

////////////////////////////////////
// MariaDB
////////////////////////////////////
const ma_headerError = '[MariaDB Error]: Invalid literal value';
const ma_booleanError = ma_headerError + `
Possible values for the boolean type are:
\u2022 TRUE
\u2022 FALSE
\u2022 A value of zero is considered false.
\u2022 Non-zero values are considered true.`        

const ma_smallintError = ma_headerError + `The range for smallint is -32768 to +32767.`;
const ma_integerError = ma_headerError + `The range for integer is -2147483648 to +2147483647.`;
const ma_bigintError = ma_headerError + `The range for integer is -9223372036854775808 to 9223372036854775807.`;
const ma_floatError = ma_headerError + `: Float`;
const ma_doubleError = ma_headerError + `: Double`;
const ma_dateError = ma_headerError + `
    Examples of possible values for the date type are:
    \u2022 1999-01-08   
    \u2022 January 8
    \u2022 1/8/1999 
    \u2022 1/18/1999    
    \u2022 01/02/03 
    \u2022 1999-Jan-08  
    \u2022 Jan-08-1999  
    \u2022 08-Jan-1999  
    \u2022 99-Jan-08    
    \u2022 08-Jan-99    
    \u2022 Jan-08-99    
    \u2022 19990108 
    \u2022 990108 
    \u2022 1999.008 
    \u2022 J2451187 
    \u2022 January 8`;
const ma_timestampError = ma_headerError + `: TimeStamp`;
const ma_charactherError = ma_headerError + `: Characther`;
const ma_varcharError = ma_headerError + `: Varchar`;
const ma_textError = ma_headerError + `: Text`;
const ma_blobError = ma_headerError + `: Blob`;
const ma_numericError = ma_headerError + `: Numeric`;
const special_error = `
    [MariaDB Error]: Specified key was too long.
    max key length is 767 bytes
    Error only present if field is primary key or unique.
`;

////////////////////////////////////
// SQLite
////////////////////////////////////
const s_headerError = '    [SQLite Error]: Invalid literal value';
const s_booleanError = s_headerError + `
    Possible values for the boolean type are:
    \u2022 1
    \u2022 0`;

const s_smallintError = s_headerError + `The range for smallint is -32768 to +32767.`;
const s_integerError = s_headerError + `The range for integer is -2147483648 to +2147483647.`;
const s_bigintError = s_headerError + `The range for integer is -9223372036854775808 to 9223372036854775807.`;
const s_floatError = s_headerError + `: Float`;
const s_doubleError = s_headerError + `: Double`;
const s_dateError = s_headerError + `
    Expect format: YYYY-MM-DD
`;
const s_timestampError = s_headerError + `
    Expect format:
        \u2022 YYYY-MM-DD HH:MM:SS
        \u2022 CURRENT_TIMESTAMP
`;
const s_charactherError = s_headerError + `: Characther`;
const s_varcharError = s_headerError + `: Varchar`;
const s_textError = s_headerError + `: Text`;
const s_blobError = s_headerError + `: Blob`;
const s_numericError = s_headerError + `: Numeric`;