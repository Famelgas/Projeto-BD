import flask
from flask import *
import logging
import psycopg2
import time
from datetime import *
import random

app = flask.Flask(__name__)

StatusCodes = {
    'success': 200,
    'api_error': 400,
    'internal_error': 500
}
listaToken = []
numeroIndice = 0


##########################################################
# DATABASE ACCESS
##########################################################

def db_connection():
    db = psycopg2.connect(
        user='aulaspl',
        password='aulaspl',
        host='localhost',
        port='5432',
        database='dbfichas'
    )

    return db


##########################################################
# ENDPOINTS
##########################################################


@app.route('/')
def landing_page():
    return """

    Hello World (Python Native)!  <br/>
    <br/>
    Check the sources for instructions on how to use the endpoints!<br/>
    <br/>
    BD 2022 Team<br/>
    <br/>
    """


##
# Demo GET
##
# Obtain all departments in JSON format
##
# To use it, access:
##
# http://localhost:8080/departments/
##
@app.route('/dbproj/user/', methods=['POST'])
def registarUtilizador():
    payload = flask.request.get_json()
    print(payload)

    conn = db_connection()
    cur = conn.cursor()

    if 'nomeutilizador' not in payload or 'password' not in payload or 'email' not in payload or 'nif' not in payload or 'morada' not in payload or 'permMod' not in payload or 'tipo' not in payload:
        response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto'}
        return flask.jsonify(response)

    statement1 = 0
    values1 = 0
    logger.debug(f'POST /dbproj/user - payload: {payload}')
    if payload['Permissoes'] == 'Administrador':
        if 'Nome' in payload:

            statement1 = 'INSERT INTO Administrador (Administrador_Nome) VALUES (%s);'
            values1 = (payload['Nome'])
        else:
            response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto'}
            return flask.jsonify(response)

    elif payload['Permissoes'] == 'Comprador':
        if 'Nome' in payload and 'Morada' in payload and 'NIF':
            statement1 = 'INSERT INTO Comprador (Nome,Morada, NIF) VALUES (%s, %s, %s);'
            values1 = (payload['Nome'], payload['Morada'], payload['NIF'])
        else:
            response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto'}
            return flask.jsonify(response)

    elif payload['Permissoes'] == 'Vendedor':
        if 'Nome' in payload and 'NIF' in payload and 'Morada' in payload:
            statement1 = 'INSERT INTO Vendedor (Nome, NIF, Morada) VALUES (%s, %s, %s);'
            values1 = (payload['Nome'], payload['NIF'], payload['Morada'])
        else:
            response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto'}
            return flask.jsonify(response)

    statement = 'INSERT INTO Utilizador (Nome, Permissoes, ID, Password, Email) VALUES (%s, %s, %s, %s, %s);'
    values = (payload['Nome'], payload['Permissoes'], payload['ID'], payload['Password'], payload['Email'])

    try:
        cur.execute("BEGIN TRANSACTION;")
        cur.execute(statement, values)
        cur.execute(statement1, values1)
        conn.commit()
        response = {'status': StatusCodes['success'], 'results': f'UTILIZADOR INSERIDO {payload["nomeutilizador"]}'}
        global numeroIndice

        listaToken.append([numeroIndice, payload['nomeutilizador']])
        numeroIndice += 1

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(f'POST /dbproj/user - error: {error}')
        response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
        conn.rollback()

    finally:
        if conn is not None:
            conn.close()
    return flask.jsonify(response)


@app.route('/dbproj/user/', methods=['PUT'])
def loginUtilizador():
    logger.info('POST /dbproj/user')
    payload = flask.request.get_json()

    conn = db_connection()
    cur = conn.cursor()

    logger.debug(f'POST /dbproj/user - payload: {payload}')

    if 'Username' not in payload or 'Password' not in payload:
        response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto'}
        return flask.jsonify(response)
    else:
        try:
            username = payload['Username']
            password = payload['Password']
            querie = 'SELECT Utilizador_Nome, Utilizador_Password FROM Utilizador WHERE Utilizador_Nome = %s and Utilizador_Password = %s return tocken;'
            values = (username, password)

            cur.execute(querie, values)
            rows = cur.fetchall()

            if len(rows) == 0:
                print("UTILIZADOR NÃO EXISTE")
                response = {'status': StatusCodes['api_error'], 'results': 'Utilizador não existe'}
                return flask.jsonify(response)
            else:
                token = 0
                print("UTILIZADOR EXISTE")
                for i in rows:
                    for j in range(len(i)):
                        if i[j] == username:
                            token = i[0]
                            break
                response = {'status': StatusCodes['success'], 'results': token}
                for i in listaToken:
                    print(i)
            conn.commit()


        except (Exception, psycopg2.DatabaseError) as error:
            logger.error(error)
            response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
            # an error occurred, rollback
            conn.rollback()

        finally:
            if conn is not None:
                conn.close()

    return flask.jsonify(response)


@app.route('/dbproj/product/', methods=['POST'])
def criarProduto():
    payload = flask.request.get_json()

    conn = db_connection()
    cur = conn.cursor()

    logger.debug(f'POST /dbproj/products - payload: {payload}')

    if 'IDProduto' not in payload or 'Stock' not in payload or 'Empresa' not in payload or 'Nome' not in payload or 'Preco' not in payload or 'tipo' not in payload:
        print("ERRO INICIAL NO PAYLOAD")
        response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto INICIAL'}
        return flask.jsonify(response)

    statement1 = 0
    values1 = 0

    if payload['tipo'] == 'Computador':
        if 'Processador' not in payload or 'RAM' not in payload or 'Disco' not in payload or 'Refrigiracao' not in payload or 'tipo' not in payload:
            print("ERRO INICIAL NO PAYLOAD")
            response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto INICIAL'}
            return flask.jsonify(response)

        statement2 = 0
        values2 = 0

        if payload['tipo'] == 'Laptop':
            if 'Ecra' not in payload or 'Teclado' not in payload or 'Peso' not in payload or 'Autonomia' not in payload:
                print("ERRO INICIAL NO PAYLOAD")
                response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto INICIAL'}
                return flask.jsonify(response)
            else:
                statement2 = 'INSERT INTO Laptop (Ecra, Teclado, Peso, Autonomia) VALUES (%s, %s, %s, %s);'
                values2 = (payload['Ecra'], payload['Teclado'], payload['Peso'], payload['Autonomia'])
                print(statement1)
                print("Laptop")
        elif payload['tipo'] == 'Fixo':
            if 'Caixa' not in payload or 'LEDs' not in payload:
                print("ERRO INICIAL NO PAYLOAD")
                response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto INICIAL'}
                return flask.jsonify(response)
            else:
                statement2 = 'INSERT INTO Laptop (Caixa, LEDs) VALUES (%s, %s);'
                values2 = (payload['Caixa'], payload['LEDs'])
                print(statement1)
                print("Fixo")

        statement1 = 'INSERT INTO Computador (Processador,RAM,Disco,Refrigiracao,tipo) VALUES (%s, %s, %s, %s, %s);'
        values1 = (payload['Processador'], payload['RAM'], payload['Disco'], payload['Refrigiracao'], payload['tipo'])


    elif payload['tipo'] == 'Televisao':
        if 'Modelo' in payload and 'Marca' in payload and 'Ecra' in payload:
            statement1 = 'INSERT INTO Televisao (Modelo, Marca, Ecra) VALUES (%s, %s, %s);'
            values1 = (
                payload['Modelo'], payload['Marca'], payload['Ecra'])
            print(statement1)
            print("Televisao")
        else:
            response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto TV'}
            return flask.jsonify(response)

    elif payload['tipo'] == 'Smartphone':

        if 'Modelo' in payload and 'Marca' in payload and 'Ecra' in payload and 'Processador' in payload:
            statement1 = 'INSERT INTO Smartphone (Modelo, Marca, Ecra,Processador) VALUES (%s, %s, %s, %s);'
            values1 = (
                payload['Modelo'], payload['Marca'], payload['Ecra'],
                payload['Processador'])
            print(statement1)
            print("SMARTPHONE")
        else:
            response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto SP'}
            return flask.jsonify(response)

    else:
        response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto'}
        return flask.jsonify(response)

    statement = 'INSERT INTO Produtos (IDProduto,Stock,Empresa,Nome,Preco,tipo) VALUES (%s, %s, %s, %s, %s, %s);'
    values = (
        payload['IDProduto'], payload['Stock'], payload['Empresa'], payload['Nome'], payload['Preco'],
        payload['tipo'])

    try:
        cur.execute('BEGIN TRANSACTION;')
        cur.execute(statement, values)
        cur.execute(statement1, values1)

        # commit the transaction
        conn.commit()
        response = {'status': StatusCodes['success'], 'results': f'UTILIZADOR INSERIDO {payload["nomeutilizador"]}'}
        global numeroIndice
        listaToken.append([numeroIndice, payload['nomeutilizador']])
        numeroIndice += 1


    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(f'POST /dbproj/user - error: {error}')
        response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
        conn.rollback()

    finally:
        if conn is not None:
            conn.close()

    return flask.jsonify(response)


@app.route('/dbproj/product/{product_id}', methods=['PUT'])
def atualizaProdutos():
    payload = flask.request.get_json()

    conn = db_connection()
    cur = conn.cursor()

    logger.debug(f'PUT /dbproj/products - payload: {payload}')
    content = request.form

    id_produto = request.args.get('id_produto')
    cur.execute('SELECT IDProduto FROM Produtos WHERE id_produto = %s;', [id_produto])

    if 'Stock' in payload:
        Stock = payload['Stock']
        statement1 = 'UPDATE Produtos SET Stock = %s WHERE id_produto = %s;'
        values = (Stock, id_produto)
        cur.execute(statement1, values)
    if 'Nome' in payload:
        Nome = payload['Nome']
        statement1 = 'UPDATE Produtos SET Nome = %s WHERE id_produto = %s;'
        values = (Nome, id_produto)
        cur.execute(statement1, values)
    if 'Preco' in payload:
        Preco = payload['Preco']
        statement1 = 'UPDATE Produtos SET Preco = %s WHERE id_produto = %s;'
        values = (Preco, id_produto)
        cur.execute(statement1, values)
    if 'Cupao' in payload:
        Cupao = payload['Cupao']
        statement1 = 'UPDATE Produtos SET Cupao = %s WHERE id_produto = %s;'
        values = (Cupao, id_produto)
        cur.execute(statement1, values)
    if 'Descricao' in payload:
        Descricao = payload['Descricao']
        statement1 = 'UPDATE Produtos SET Descricao = %s WHERE id_produto = %s;'
        values = (Descricao, id_produto)
        cur.execute(statement1, values)

    else:
        response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto'}
        return flask.jsonify(response)

    try:
        # commit the transaction
        conn.commit()
        response = {'status': StatusCodes['success'], 'results': f'UTILIZADOR INSERIDO {payload["nomeutilizador"]}'}
        global numeroIndice
        listaToken.append([numeroIndice, payload['nomeutilizador']])
        numeroIndice += 1


    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(f'POST /dbproj/user - error: {error}')
        response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
        conn.rollback()

    finally:
        if conn is not None:
            conn.close()

    return flask.jsonify(response)


@app.route('/dbproj/order', methods=['POST'])
def Compra():
    payload = flask.request.get_json()

    conn = db_connection()
    cur = conn.cursor()

    logger.debug(f'POST /dbproj/order - payload: {payload}')

    token = request.args.get('token')
    cur.execute('SELECT Nome FROM Utlizador WHERE ID = %s;', [token])

    if 'cart' not in payload or 'Cupao' not in payload:
        print("ERRO INICIAL NO PAYLOAD")
        response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto INICIAL'}
        return flask.jsonify(response)
    else:
        preco = 0
        statement1 = 0
        for i in 'cart':
            id = i[0]
            quantidade = i[1]
            if cur.execute('SELECT Stock FROM Produtos WHERE IDProdutos = %s;', id) > quantidade:
                statement1 = 'UPDATE Produtos SET Stock = %s WHERE IDProduto = %s;'
                values = (cur.execute('SELECT Stock FROM Produtos WHERE IDProdutos = %s;', id) - quantidade, id)
                cur.execute(statement1, values)
                preco += cur.execute('SELECT Preco FROM Produtos WHERE IDProdutos = %s;', id) * quantidade
            else:
                print("Stock not suficient")
                response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto INICIAL'}
                return flask.jsonify(response)
    statement = 'INSERT INTO Compras (ID,IDComprador,IDCupao,Data) VALUES (%s, %s, %s, %s, %s, %s);'
    get_id_statement = 'SELECT max(ID) FROM Compras;'
    cur.execute(get_id_statement)
    last_id = cur.fetchone()
    if last_id is None:
        last_id = (0,)
    now = datetime.now()
    values = (last_id[0] + 1, token, payload['Cupao'],
              now.strftime("%Y-%m-%d %H:%M:%S"))
    cur.execute(statement, values)
    for i in 'cart':
        id = i[0]
        statement2 = 'INSERT INTO HistoricoCompras (IDCompra, IDProduto) VALUES (%i, %i);'
        values2 = (last_id[0] + 1, id)
        cur.execute(statement2, values2)

    try:
        # commit the transaction
        conn.commit()
        response = {'status': StatusCodes['success'], 'results': f'UTILIZADOR INSERIDO {payload["nomeutilizador"]}'}
        global numeroIndice
        listaToken.append([numeroIndice, payload['nomeutilizador']])
        numeroIndice += 1


    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(f'POST /dbproj/user - error: {error}')
        response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
        conn.rollback()

    finally:
        if conn is not None:
            conn.close()

    return flask.jsonify(response)


@app.route('/dbproj/rating/{product_id}', methods=['POST'])
def raiting_feedback():
    payload = flask.request.get_json()

    conn = db_connection()
    cur = conn.cursor()

    token = request.args.get('token')

    if 'raiting' not in payload or 'feedback' not in payload:
        print("ERRO INICIAL NO PAYLOAD")
        response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto INICIAL'}
        return flask.jsonify(response)
    else:
        statement = 'UPDATE Produtos SET Classificacao = %i WHERE IDProduto = %i;'
        values = (
            (cur.execute('SELECT Classificacao FROM Produtos WHERE IDProduto = %s;', token) + payload[
                'raiting']) / 2,
            token)
        cur.execute(statement, values)
        statement1 = 'INSERT INTO Comentarios (IDComentario,IDAntrior,Menssagem) VALUES (%i,%i, %s);'
        get_id_statement = 'SELECT max(IDComentario) FROM Comentarios;'
        cur.execute(get_id_statement)
        last_id = cur.fetchone()
        if last_id is None:
            last_id = (0,)
        values1 = (last_id[0] + 1, last_id[0], payload['feedback'])
        cur.execute(statement1, values1)

    try:
        # commit the transaction
        conn.commit()
        response = {'status': StatusCodes['success'], 'results': f'UTILIZADOR INSERIDO {payload["nomeutilizador"]}'}
        global numeroIndice
        listaToken.append([numeroIndice, payload['nomeutilizador']])
        numeroIndice += 1


    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(f'POST /dbproj/user - error: {error}')
        response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
        conn.rollback()

    finally:
        if conn is not None:
            conn.close()

    return flask.jsonify(response)


@app.route('/dbproj/product/{product_id}', methods=['GET'])
def consulta_produtos():
    payload = flask.request.get_json()

    conn = db_connection()
    cur = conn.cursor()

    logger.debug(f'GET /dbproj/product - payload: {payload}')
    idu = request.args.get('product_id')
    cur.execute('SELECT * from Produtos WHERE IDProduto=%s;', [idu])
    rows = cur.fetchall()
    if len(rows) < 1:
        response = {'status': StatusCodes['api_error'], 'results': 'Produto não encontrado'}
    else:
        response = {'status': StatusCodes['success'], 'results': rows}

    try:
        # commit the transaction
        conn.commit()
        response = {'status': StatusCodes['success'], 'results': f'UTILIZADOR INSERIDO {payload["nomeutilizador"]}'}
        global numeroIndice
        listaToken.append([numeroIndice, payload['nomeutilizador']])
        numeroIndice += 1


    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(f'POST /dbproj/user - error: {error}')
        response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
        conn.rollback()

    finally:
        if conn is not None:
            conn.close()

    return flask.jsonify(response)


@app.route('/dbproj/campaign/{admin_id}', methods=['POST'])
def criar_capanha():
    # {“description”: “campaign description”, “date_start”: “starting date”,
    # “date_end”: “ending date”, “coupons”: number of coupons to be generated,
    # “discount”: discount percentage, (...)}

    payload = flask.request.get_json()

    conn = db_connection()
    cur = conn.cursor()

    logger.debug(f'POST /dbproj/campaign - payload: {payload}')

    admin_id = request.args.get('admin_id')
    if cur.execute('SELECT Permissoes FROM Utilizador WHERE ID = %s;', [admin_id]) != "Administrador":
        response = {'status': StatusCodes['api_error'], 'results': 'Utilizador não tem permissões'}
        return flask.jsonify(response)
    else:
        try:
            max_data = cur.execute('SELECT max(DataFim) FROM Capanha;')
            now = datetime.now()

            if max_data > now:
                response = {'status': StatusCodes['api_error'], 'results': 'Já existe uma campanha ativa'}
                return flask.jsonify(response)

            else:
                get_id_statement = 'SELECT max(ID) FROM Campanha;'
                cur.execute(get_id_statement)
                last_id = cur.fetchone()
                if last_id is None:  # se ainda não tiverem sido inseridos leilões, cria um novo com id = 1
                    last_id = (0,)

                statement = 'INSERT INTO Capanha (ID, IDAdministrador, Descricao, Permissoes, DataInicio, DataFim, ValorDesconto, NumCupoes) VALUES (%s, %s, %s, %s, %s);'
                values = (last_id[0] + 1, admin_id, payload['Descricao'], payload['Permissoes'], payload['DataInicio'],
                          payload['DataFim'], payload['ValorDesconto'], payload['NumCupoes'])
                cur.execute(statement, values)
                conn.commit()
                response = {'status': StatusCodes, 'results': 'campaign_id'}

        except (Exception, psycopg2.DatabaseError) as error:
            logger.error(error)
            response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
            # an error occurred, rollback
            conn.rollback()

        finally:
            if conn is not None:
                conn.close()

    return flask.jsonify(response)


@app.route('/dbproj/filtros', methods=['GET'])
def filtros():
    payload = flask.request.get_json()

    conn = db_connection()
    cur = conn.cursor()

    logger.debug(f'POST /dbproj/campaign - payload: {payload}')
    try:
        if 'Tipo' in payload:
            Tipo = payload['Tipo']

            if Tipo == "Computador":
                statement = 'SELECT * from Produtos, Computador WHERE Tipo = %s AND Produtos.IDProduto = Computador.ID;'
            if Tipo == "Televisao":
                statement = 'SELECT * from Produtos, Televisao WHERE Tipo = %s AND Produtos.IDProduto = Televisao.ID;'
            if Tipo == "SmartPhone":
                statement = 'SELECT * from Produtos, SmartPhone WHERE Tipo = %s AND Produtos.IDProduto = SmartPhone.ID;'

            values = (Tipo)
            cur.execute(statement, values)
            rows = cur.fetchall()
            conn.commit()
            response = {'status': StatusCodes['success'], 'results': rows}
        if 'SubTipo' in payload:
            SubTipo = payload['SubTipo']

            if SubTipo == "Laptop":
                statement = 'SELECT * from Produtos, Laptop WHERE SubTipo = %s AND Produtos.IDProduto = Laptop.ID;'
            if SubTipo == "Fixo":
                statement = 'SELECT * from Produtos, Fixo WHERE SubTipo = %s AND Produtos.IDProduto = Fixo.ID;'

            values = (SubTipo)
            cur.execute(statement, values)
            rows = cur.fetchall()
            conn.commit()
            response = {'status': StatusCodes['success'], 'results': rows}

    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(error)
        response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
        # an error occurred, rollback
        conn.rollback()

    finally:
        if conn is not None:
            conn.close()

    return flask.jsonify(response)


@app.roure('/deproj/report/camping', methods=['GET'])
def estatisticas_campanha():
    payload = flask.request.get_json()

    conn = db_connection()
    cur = conn.cursor()

    logger.debug(f'GET /deproj/report/camping - payload: {payload}')
    tabela = cur.execute('SELECT * FROM Campanha;')
    rows = cur.fetchall()
    for i in rows:
        if len(i) < 1:
            response = {'status': StatusCodes['api_error'], 'results': 'Produto não encontrado'}
        else:
            response = {'status': StatusCodes['success'], 'results': rows}
    try:
        # commit the transaction
        conn.commit()
        response = {'status': StatusCodes['success'], 'results': f'UTILIZADOR INSERIDO {payload["nomeutilizador"]}'}
        global numeroIndice
        listaToken.append([numeroIndice, payload['nomeutilizador']])
        numeroIndice += 1


    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(f'POST /dbproj/user - error: {error}')
        response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
        conn.rollback()

    finally:
        if conn is not None:
            conn.close()

    return flask.jsonify(response)


@app.route('/dbproj/comparar', methods=['GET'])
def comparar_produtos():
    payload = flask.request.get_json()

    conn = db_connection()
    cur = conn.cursor()

    logger.debug(f'POST /dbproj/campaign - payload: {payload}')

    prod1 = payload['produto1']
    prod2 = payload['produto2']

    if 'prod1' not in payload or 'prod2' not in payload:
        response = {'status': StatusCodes['api_error'], 'results': 'ERROR in payload'}
        return flask.jsonify(response)
    else:
        cur.execute('SELECT * FROM Produtos WHERE IDProduto = %i;', prod1)
        rows = cur.fetchall()
        if rows[9] == 'Computador':
            cur.execute('SELECT * FROM Computador WHERE IDProduto = %i;', prod1)
            rows = cur.fetchall()
            if rows[4] == 'Laptop':
                cur.execute('SELECT * FROM Produtos,Computador,Laptop WHERE IDProduto = %i;', prod1)
                rows = cur.fetchall()
                response = {'status': StatusCodes['success'], 'results': rows}
            elif rows[4] == 'Fixo':
                cur.execute('SELECT * FROM Produtos,Computador,Fixo WHERE IDProduto = %i;', prod1)
                rows = cur.fetchall()
                response = {'status': StatusCodes['success'], 'results': rows}
            else:
                response = {'status': StatusCodes['api_error'], 'results': 'Produto não encontrado'}
        elif rows[9] == 'Televisao':
            cur.execute('SELECT * FROM Produtos,Televisao WHERE IDProduto = %i;', prod1)
            rows = cur.fetchall()
            response = {'status': StatusCodes['success'], 'results': rows}
        elif rows[9] == 'Smartphone':
            cur.execute('SELECT * FROM Produtos,Smartphone WHERE IDProduto = %i;', prod1)
            rows = cur.fetchall()
            response = {'status': StatusCodes['success'], 'results': rows}
        else:
            response = {'status': StatusCodes['api_error'], 'results': 'Produto não encontrado'}

        cur.execute('SELECT * FROM Produtos WHERE IDProduto = %i;', prod2)
        rows = cur.fetchall()
        if rows[9] == 'Computador':
            cur.execute('SELECT * FROM Computador WHERE IDProduto = %i;', prod2)
            rows = cur.fetchall()
            if rows[4] == 'Laptop':
                cur.execute('SELECT * FROM Produtos,Computador,Laptop WHERE IDProduto = %i;', prod2)
                rows = cur.fetchall()
                response = {'status': StatusCodes['success'], 'results': rows}
            elif rows[4] == 'Fixo':
                cur.execute('SELECT * FROM Produtos,Computador,Fixo WHERE IDProduto = %i;', prod2)
                rows = cur.fetchall()
                response = {'status': StatusCodes['success'], 'results': rows}
            else:
                response = {'status': StatusCodes['api_error'], 'results': 'Produto não encontrado'}
        elif rows[9] == 'Televisao':
            cur.execute('SELECT * FROM Produtos,Televisao WHERE IDProduto = %i;', prod2)
            rows = cur.fetchall()
            response = {'status': StatusCodes['success'], 'results': rows}
        elif rows[9] == 'Smartphone':
            cur.execute('SELECT * FROM Produtos,Smartphone WHERE IDProduto = %i;', prod2)
            rows = cur.fetchall()
            response = {'status': StatusCodes['success'], 'results': rows}
        else:
            response = {'status': StatusCodes['api_error'], 'results': 'Produto não encontrado'}
    try:
        # commit the transaction
        conn.commit()
        response = {'status': StatusCodes['success'],
                    'results': f'UTILIZADOR INSERIDO {payload["nomeutilizador"]}'}
        global numeroIndice
        listaToken.append([numeroIndice, payload['nomeutilizador']])
        numeroIndice += 1


    except (Exception, psycopg2.DatabaseError) as error:
        logger.error(f'POST /dbproj/user - error: {error}')
        response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
        conn.rollback()

    finally:
        if conn is not None:
            conn.close()

    return flask.jsonify(response)


if __name__ == '__main__':
    # set up logging
    logging.basicConfig(filename='log_file.log')
    logger = logging.getLogger('logger')
    logger.setLevel(logging.DEBUG)
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)

    # create formatter
    formatter = logging.Formatter('%(asctime)s [%(levelname)s]:  %(message)s', '%H:%M:%S')
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    host = '127.0.0.1'
    port = 8080
    app.run(host=host, debug=True, threaded=True, port=port)
    logger.info(f'API v1.1 online: http://{host}:{port}')
