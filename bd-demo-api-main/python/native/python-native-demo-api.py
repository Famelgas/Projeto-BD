import flask
from flask import *
import logging
import psycopg2
from datetime import *

app = flask.Flask(__name__)

StatusCodes = {
    'success': 200,
    'api_error': 400,
    'internal_error': 500
}
listaToken = []
numeroIndice = 0


def db_connection():
    db = psycopg2.connect(
        user='postgres',
        password='postgres',
        host='localhost',
        port='5432',
        database='postgres'
    )

    return db


@app.route('/')
def landing_page():
    return


@app.route('/dbproj/user/', methods=['POST'])
def registarUtilizador():
    payload = flask.request.get_json()

    conn = db_connection()
    cur = conn.cursor()

    logger.debug(f'POST /dbproj/user - payload: {payload}')

    if 'Nome' not in payload or 'Password' not in payload or 'Permissoes' not in payload or 'ID' not in payload or 'Email' not in payload or 'Morada' not in payload or 'NIF' not in payload:
        response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto'}
        return flask.jsonify(response)
    else:
        statement = 'INSERT INTO utilizador (Nome, Permissoes, ID, Password, Email) VALUES (%s, %s, %s, %s, %s);'
        values = (payload['Nome'], payload['Permissoes'], payload['ID'], payload['Password'], payload['Email'])
        cur.execute(statement, values)

    if payload['Permissoes'] == 'Administrador':
        if 'Nome' in payload:
            statement1 = 'INSERT INTO administrador (Nome, ID) VALUES (%s, %s);'
            values1 = (payload['Nome'], payload['ID'])
            cur.execute(statement1, values1)
        else:
            response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto'}
            return flask.jsonify(response)

    elif payload['Permissoes'] == 'Comprador':
        if 'Nome' in payload and 'Morada' in payload and 'NIF':
            statement1 = 'INSERT INTO comprador (Nome,Morada, NIF,ID) VALUES (%s, %s,  %s,%s);'
            values1 = (payload['Nome'], payload['Morada'], payload['NIF'], payload['ID'])
            cur.execute(statement1, values1)
        else:
            response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto'}
            return flask.jsonify(response)

    elif payload['Permissoes'] == 'Vendedor':
        if 'Nome' in payload and 'NIF' in payload and 'Morada' in payload:
            statement1 = 'INSERT INTO vendedor (Nome, NIF, Morada,ID) VALUES (%s,  %s, %s,%s);'
            values1 = (payload['Nome'], payload['NIF'], payload['Morada'], payload['ID'])
            cur.execute(statement1, values1)
        else:
            response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto'}
            return flask.jsonify(response)
    else:
        response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto'}
        return flask.jsonify(response)

    try:
        conn.commit()
        response = {'status': StatusCodes['success'], 'results': f'UTILIZADOR INSERIDO {payload["nomeutilizador"]}'}
        global numeroIndice

        listaToken.append([numeroIndice, payload['ID']])
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
            querie = 'SELECT ID FROM Utilizador WHERE Utilizador_Nome = %s and Utilizador_Password = %s return token;'
            values = (username, password)
            cur.execute(querie, values)
            rows = cur.fetchall()

            if len(rows) == 0:
                print("UTILIZADOR NÃO EXISTE")
                response = {'status': StatusCodes['api_error'], 'results': 'Utilizador não existe'}
                return flask.jsonify(response)
            else:
                listaToken.append(rows)
                response = {'status': StatusCodes['success'], 'results': rows}
            conn.commit()


        except (Exception, psycopg2.DatabaseError) as error:
            logger.error(f'PUT /dbproj/user - error: {error}')
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

    cur.execute('SELECT Permissoes FROM Utilizador WHERE ID = %i;', listaToken[len(listaToken) - 1])
    rows = cur.fetchall()
    if rows == 'Vendedor':
        response = {'status': StatusCodes['api_error'], 'results': 'Sem premissoes'}
        return flask.jsonify(response)
    else:
        if 'IDProduto' not in payload or 'Stock' not in payload or 'Empresa' not in payload or 'Nome' not in payload or 'Preco' not in payload or 'tipo' not in payload:
            response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto INICIAL'}
            return flask.jsonify(response)

        if payload['tipo'] == 'Computador':
            if 'Processador' not in payload or 'RAM' not in payload or 'Disco' not in payload or 'Refrigiracao' not in payload or 'tipo' not in payload:
                print("ERRO INICIAL NO PAYLOAD")
                response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto INICIAL'}
                return flask.jsonify(response)

            if payload['tipo'] == 'Laptop':
                if 'Ecra' not in payload or 'Teclado' not in payload or 'Peso' not in payload or 'Autonomia' not in payload:
                    print("ERRO INICIAL NO PAYLOAD")
                    response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto INICIAL'}
                    return flask.jsonify(response)
                else:
                    statement1 = 'INSERT INTO Laptop (Ecra, Teclado, Peso, Autonomia) VALUES (%s, %s, %s, %s);'
                    values1 = (payload['Ecra'], payload['Teclado'], payload['Peso'], payload['Autonomia'])
                    cur.execute(statement1, values1)
            elif payload['tipo'] == 'Fixo':
                if 'Caixa' not in payload or 'LEDs' not in payload:
                    print("ERRO INICIAL NO PAYLOAD")
                    response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto INICIAL'}
                    return flask.jsonify(response)
                else:
                    statement2 = 'INSERT INTO Laptop (Caixa, LEDs) VALUES (%s, %s);'
                    values2 = (payload['Caixa'], payload['LEDs'])
            statement1 = 'INSERT INTO Computador (Processador,RAM,Disco,Refrigiracao,tipo) VALUES (%s, %s, %s, %s, %s);'
            values1 = (
                payload['Processador'], payload['RAM'], payload['Disco'], payload['Refrigiracao'], payload['tipo'])
        elif payload['tipo'] == 'Televisao':
            if 'Modelo' in payload and 'Marca' in payload and 'Ecra' in payload:
                statement1 = 'INSERT INTO Televisao (Modelo, Marca, Ecra) VALUES (%s, %s, %s);'
                values1 = (
                    payload['Modelo'], payload['Marca'], payload['Ecra'])
            else:
                response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto TV'}
                return flask.jsonify(response)

        elif payload['tipo'] == 'Smartphone':
            if 'Modelo' in payload and 'Marca' in payload and 'Ecra' in payload and 'Processador' in payload:
                statement1 = 'INSERT INTO Smartphone (Modelo, Marca, Ecra,Processador) VALUES (%s, %s, %s, %s);'
                values1 = (
                    payload['Modelo'], payload['Marca'], payload['Ecra'],
                    payload['Processador'])
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
        logger.error(f'POST /dbproj/products - error: {error}')
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
    cur.execute('SELECT IDProduto FROM Produtos WHERE ID = %s;', [id_produto])
    rows = cur.fetchall()
    cur.execute('SELECT Permissoes FROM Utilizador WHERE ID = %i;', listaToken[len(listaToken) - 1])
    row2 = cur.fetchall()
    cur.execute('SELECT Empresa FROM Produtos WHERE ID = %i;', [id_produto])
    row3 = cur.fetchall()
    if row2 != 'Vendedor' or row3 != rows:
        response = {'status': StatusCodes['api_error'], 'results': 'Sem premissoes'}
        return flask.jsonify(response)
    else:
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
        logger.error(f'PUT /dbproj/products - error: {error}')
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

    cur.execute('SELECT Premissoes FROM Utilizador WHERE ID = %i;', listaToken[len(listaToken) - 1])
    row3 = cur.fetchall()
    if row3 != 'Comprador':
        response = {'status': StatusCodes['api_error'], 'results': 'Sem premissoes'}
        return flask.jsonify(response)
    else:
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
        logger.error(f'POST /dbproj/order - error: {error}')
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

    logger.debug(f'POST /dbproj/rating - payload: {payload}')

    token = request.args.get('token')

    cur.execute('SELECT Premissoes FROM Utilizador WHERE ID = %i;', listaToken[len(listaToken) - 1])
    row3 = cur.fetchall()
    if row3 != 'Comprador':
        response = {'status': StatusCodes['api_error'], 'results': 'Sem premissoes'}
        return flask.jsonify(response)
    else:
        if 'raiting' not in payload or 'feedback' not in payload:
            print("ERRO INICIAL NO PAYLOAD")
            response = {'status': StatusCodes['api_error'], 'results': 'Payload incorreto INICIAL'}
            return flask.jsonify(response)
        else:
            if payload['ratting'] > 5 or payload['ratting'] < 0:
                response = {'status': StatusCodes['api_error'], 'results': 'Rating invalido'}
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
        logger.error(f'POST /dbproj/rating - error: {error}')
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
        logger.error(f'GET /dbproj/product - error: {error}')
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
            logger.error(f'POST /dbproj/campaign - error: {error}')
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

    logger.debug(f'GET /dbproj/product/filters - payload: {payload}')
    cur.execute('SELECT Premissoes FROM Utilizador WHERE ID = %i;', listaToken[len(listaToken) - 1])
    row3 = cur.fetchall()
    if row3 != 'Comprador':
        response = {'status': StatusCodes['api_error'], 'results': 'Sem premissoes'}
        return flask.jsonify(response)
    else:
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
            logger.error(f'GET /dbproj/product/filters - error: {error}')
            response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
            # an error occurred, rollback
            conn.rollback()

        finally:
            if conn is not None:
                conn.close()

    return flask.jsonify(response)


@app.route('/dbproj/report/campaign', methods=['GET'])
def estatisticas_campanha():
    payload = flask.request.get_json()

    conn = db_connection()
    cur = conn.cursor()

    logger.debug(f'GET /dbproj/report/campaign - payload: {payload}')
    tabela = cur.execute('SELECT * FROM Campanha;')
    rows = cur.fetchall()
    cur.execute('SELECT Premissoes FROM Utilizador WHERE ID = %i;', listaToken[len(listaToken) - 1])
    row3 = cur.fetchall()
    if row3 != 'Admnistrador':
        response = {'status': StatusCodes['api_error'], 'results': 'Sem premissoes'}
        return flask.jsonify(response)
    else:
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
        logger.error(f'GET /dbproj/report/campaign - error: {error}')
        response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
        conn.rollback()

    finally:
        if conn is not None:
            conn.close()

    return flask.jsonify(response)


@app.route('/proj/report/year',methods=['GET'])        
def stats():
    payload = flask.request.get_json()
    
    conn = db_connection()
    cur = conn.cursor()
    logger.debug(f'GET /dbproj/product - payload: {payload}')
    cur.execute("SELECT * FROM Compras WHERE Data >= DATEADD(M,-12,GETDATE());")
    rows=cur.fetchall()
    if len(rows)<1:
        response = {'status': StatusCodes['api_error'], 'results': 'Erro a obter dados'}
        return flask.jsonify(response)
    else:
        try:
            for i in range(len(rows)):
                response = {'status': StatusCodes['success'], 'results':  {"mes": i+1, "valor total de compras": rows[i][7],"total de compras feitas":len(rows[i])} }
                flask.jsonify(response)
            conn.commit()

        except (Exception, psycopg2.DatabaseError) as error:
            logger.error(f'GET /dbproj/product - error: {error}')
            response = {'status': StatusCodes['internal_error'], 'errors': str(error)}
            conn.rollback()

        finally:
            if conn is not None:
                conn.close()

        return flask.jsonify(response)



@app.route('/dbproj/product/compare', methods=['GET'])
def comparar_produtos():
    payload = flask.request.get_json()

    conn = db_connection()
    cur = conn.cursor()

    logger.debug(f'GET /dbproj/product/compare - payload: {payload}')


    prod1 = payload['produto1']
    prod2 = payload['produto2']

    cur.execute('SELECT Premissoes FROM Utilizador WHERE ID = %i;', listaToken[len(listaToken) - 1])
    row3 = cur.fetchall()
    if row3 != 'Comprador':
        response = {'status': StatusCodes['api_error'], 'results': 'Sem premissoes'}
        return flask.jsonify(response)
    else:
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
        logger.error(f'GET /dbproj/product/compare - error: {error}')
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
