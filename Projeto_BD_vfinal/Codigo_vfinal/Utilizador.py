import psycopg2
from datetime import datetime
from datetime import timedelta

conn = psycopg2.connect("host=localhost dbname=projeto user=postgres password=postgres")
cur = conn.cursor()


def PesquisaFilme(nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    nome = input("Insira o nome da Serie/Filme: ")
    nome_pesquisa = "%" + nome + "%"

    cur.execute("SELECT * FROM produto where nome_do_produto like %s", (nome_pesquisa,))
    i = cur.fetchall()
    if (len(i) == 0):
        print('Não foram encontradas Séries/Filmes com esse nome')
        return
    else:
        print('Foram encontrados as seguintes Series/Filmes: ')
        for n in range(len(i)):
            a, b, c, d, e, f, g, h, i = i[n]
            print(n + 1, '- ', b)

        n = int(input('Se desejar ver mais informacao sobre um deles insira o seu numero (0 cancela a pesquisa): '))
        if (n == 0):
            return
        elif (n > cur.rowcount):
            print("Número inválido")
            return
        else:
            cur.execute("SELECT * FROM produto where nome_do_produto like %s", (nome_pesquisa,))
            i = cur.fetchall()
            a, b, c, d, e, f, g, h, i = i[n - 1]
            print(' Nome: ', b, '\n Produtor: ', c, '\n Detalhes: ', d, '\n Tipo: ', e,
                  '\n Idade recomendada: ', int(h))
            cur.execute("SELECT ator_nome FROM ator_produto where produto_numero_do_produto = %s", (a,))
            i = cur.fetchall()
            print('\n Atores:')
            for n in range(len(i)):
                nome_ator, = i[n]
                print('\t', nome_ator)
            cur.execute("SELECT realizador_nome FROM produto_realizador where produto_numero_do_produto = %s", (a,))
            i = cur.fetchall()
            print('\n Realizadores:')
            for n in range(len(i)):
                nome_realizador, = i[n]
                print('\t', nome_realizador)


def ListarArtigos(nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    cur.execute("SELECT nome_do_produto FROM produto")
    i = cur.fetchall()
    contador = 1
    for n in range(cur.rowcount):
        nome, = i[n]
        print(contador, "-", nome)
        contador = contador + 1


def alugar(email_utilizador,nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    artigo_alugado = input("Que artigo deseja alugar?")
    cur.execute("SELECT * FROM produto where nome_do_produto = %s", (artigo_alugado,))

    if (cur.rowcount == 0):
        print("Este artigo não existe na base de dados")
        return
    else:
        i = cur.fetchall()

        num, nome, produtor, detalhes, genero, preco, tempo, idadereq, emailadmin = i[0]
        preco = float(preco)
        print("***********************************")
        print("Nome: ", nome)
        print("Produtor: ", produtor)
        print("Detalhes: ", detalhes)
        print("Géneros: ", genero)
        print("Preço/mes: ", preco)
        print("Idade Recomendada: ", int(idadereq))

        print("***********************************")
        print("1- Alugar")
        print("2- Não alugar")
        print("***********************************\n")
        opcao = int(input(""))
        cur.execute("SELECT idade FROM utilizador WHERE email = %s",(email_utilizador,))
        idade, = cur.fetchall()
        if ((opcao == 1) and (idadereq<=idade)):
            data_presente = datetime.now()
            cur.execute(
                "SELECT * FROM aluguer WHERE (cliente_utilizador_email =%s AND produto_numero_do_produto = %s AND data_final>%s)",
                (email_utilizador, num, data_presente))

            if (cur.rowcount > 0):
                print("Este produto já está alugado")
                return
            cur.execute("SELECT saldo FROM cliente where utilizador_email = %s",
                        (email_utilizador,))  # arranjar forma de manter o email quando se dá login
            tempo_aluguer = float(input("durante quanto tempo deseja alugar, em meses: "))
            data_final_aluguer = datetime.now() + timedelta(days=tempo_aluguer * 31)
            preco_final_aluguer = float(preco * tempo_aluguer)
            saldo = cur.fetchall()
            saldo, = saldo[0]
            saldo = float(saldo)
            if (preco_final_aluguer > saldo):
                print("Não possui saldo suficiente para fazer o aluguer\n O seu saldo é de", saldo)
                return
            else:
                saldo_final = saldo - preco_final_aluguer
                print(saldo_final, email_utilizador)

                cur.execute(
                    "UPDATE cliente SET saldo = %s, artigos_alugados = artigos_alugados+1 WHERE utilizador_email = %s",
                    (saldo_final, email_utilizador))

                cur.execute("INSERT INTO aluguer "
                            "VALUES (%s,%s,%s,%s,%s)",
                            (data_final_aluguer, preco_final_aluguer, data_presente, email_utilizador, num))
                conn.commit()
                print("O aluguer custa", preco_final_aluguer, "€ e acabará a", data_final_aluguer)

        elif (opcao == 2):
            return
        else:
            print("Não tem idade suficiente para alugar este filme/serie")
            return


def artigos_disponiveis(email_utilizador,nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    data_presente = datetime.now()
    cur.execute("SELECT produto_numero_do_produto FROM aluguer WHERE (cliente_utilizador_email = %s AND data_final>%s)",
                (email_utilizador, data_presente))
    if(cur.rowcount == 0):
        print("\nNão tem produtos disponiveis")
        return
    else:
        n = 0
        for numero_produto in cur.fetchall():
            cur.execute("SELECT nome_do_produto FROM produto WHERE numero_do_produto = %s", (numero_produto,))
            nome, = cur.fetchone()

            n = n + 1

            print(n, "- ", nome)

        cur.execute("SELECT produto_numero_do_produto FROM aluguer WHERE (cliente_utilizador_email = %s AND data_final<%s)",
                    (email_utilizador, data_presente))
        n = 0

        for numero_produto in cur.fetchall():
            cur.execute("SELECT nome_do_produto FROM produto WHERE numero_do_produto = %s", (numero_produto,))
            nome, = cur.fetchone()

            n = n + 1
            print("Artigos alugados no passado")
            print(n, "- ", nome)


def Valor_gasto(email_utilizador,nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    data_presente = datetime.now()
    gasto_filmes = 0
    gasto_series = 0
    cur.execute(
        "SELECT preco,produto_numero_do_produto FROM aluguer WHERE cliente_utilizador_email = %s AND data_final < %s",
        (email_utilizador, data_presente,))
    aluguer_preco = cur.fetchall()
    if (cur.rowcount == 0):
        print("\nAinda não gastou dinheiro em alugueres")
        return
    for n in aluguer_preco:
        preco, numero, = n
        print(preco)
        cur.execute("SELECT tipo FROM produto WHERE numero_do_produto = %s", (numero,))
        tipo, = cur.fetchone()
        tipo2 = tipo.split(',')
        if (tipo2[0] == 'Series'):
            gasto_series = gasto_series + preco

        elif (tipo2[0] == 'Movie'):
            gasto_filmes = gasto_filmes + preco
    print("Gastou", gasto_series, "em series")
    print("Gastou", gasto_filmes, "em filmes")
    print("Gastou", gasto_series + gasto_filmes, "no total")


def VerMensagens(email_utilizador,nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    loop = True
    while (loop == True):
        cur.execute("SELECT mensagem_id FROM read_check WHERE cliente_utilizador_email = %s AND lida = FALSE",
                    (email_utilizador,))
        i = cur.fetchall()
        counter = 0
        if (cur.rowcount == 0):
            print("\nNão tem mensagens por ler")
            return
        else:
            print("Tem", cur.rowcount, "por ler")
            for id_mensagem in i:
                cur.execute("SELECT titulo FROM mensagem WHERE id = %s", id_mensagem)
                titulo, = cur.fetchone()
                counter = counter + 1
                print(counter, "-", titulo)
            n = int(input(("")))
            if (n == 0):
                return
            elif (n > len(i)):
                print("Número inválido")
            else:
                id_mensagem = i[n - 1]
                cur.execute("SELECT mensagem FROM mensagem WHERE id = %s", (id_mensagem))
                mensagem, = cur.fetchone()
                print(mensagem)
                select = int(input("\nDeseja ver mais mensagens?\n1- Sim\n2- Não"))
                if (select == 2):
                    cur.execute(
                        "UPDATE read_check SET lida = TRUE WHERE cliente_utilizador_email = %s AND mensagem_id = %s",
                        (email_utilizador, id_mensagem))
                    conn.commit()
                    loop = False
                    return
                elif (select == 1):
                    cur.execute(
                        "UPDATE read_check SET lida = TRUE WHERE cliente_utilizador_email = %s AND mensagem_id = %s",
                        (email_utilizador, id_mensagem))
                    conn.commit()


def AumentarSaldo(email_utilizador,nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    saldo_pedir = float(input("\nEm quanto deseja aumentar o seu saldo: "))
    mensagem_padrao = str('Saldo,' + str(saldo_pedir) + ', Email,' + email_utilizador)
    cur.execute("SELECT * FROM mensagem")
    id_mensagem = cur.rowcount + 1
    data_presente = datetime.now()
    cur.execute("INSERT INTO mensagem VALUES (%s,'Saldo', %s, %s, 'mensagem@admin.pt')",
                (id_mensagem, mensagem_padrao, data_presente))
    cur.execute("INSERT INTO read_check VALUES (FALSE, %s, 'mensagem@admin.pt') ", (id_mensagem,))
    conn.commit()


def ProcurarAtor(nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    nome = input("\nInsira o nome do ator: ")
    nome_pesquisa = "%" + nome + "%"

    cur.execute("SELECT * FROM ator where nome like %s", (nome_pesquisa,))
    i = cur.fetchall()
    if (len(i) == 0):
        print('\nNão foram encontrados atores com esse nome')
        return
    elif (len(i) == 1):
        a, b, c, d, e = i[cur.rowcount - 1]
        print('\nNome: ', a, '\nGenero: ', d, '\nData de nascimento: ', b, '\nLocal de nascimento: ', c,
              '\n Nacionalidade: ', e)
        filme = int(input("\nDeseja ver os filmes em que ele participa?\n1- Sim\n2- Não"))
        if (filme == 1):
            print("")
            PesquisaShort(a, 'ator')
        else:
            return
    else:
        print('\nForam encontrados os seguintes atores: ')
        for n in range(len(i)):
            a, b, c, d, e = i[n]
            print(n + 1, '- ', a)

        n = int(input('\nSe desejar ver mais informacao sobre um deles insira o seu numero (0 cancela a pesquisa): '))
        if (n == 0):
            return
        elif (n > cur.rowcount):
            print("\nNúmero inválido")
            return
        else:
            a, b, c, d, e = i[n - 1]
            print('\nNome: ', a, '\nGenero: ', d, '\nData de nascimento: ', b, '\nLocal de nascimento: ', c,
                  '\n Nacionalidade: ', e)
            filme = int(input("\nDeseja ver os filmes em que ele participa?\n1- Sim\n2-Não"))
            if (filme == 1):
                print("")
                PesquisaShort(a, 'ator')
            else:
                return


def ProcurarRealizador(nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    nome = input("Insira o nome do Realizador: ")
    nome_pesquisa = "%" + nome + "%"

    cur.execute("SELECT * FROM realizador where nome like %s", (nome_pesquisa,))
    i = cur.fetchall()
    if (len(i) == 0):
        print('\nNão foram encontrados realizadores com esse nome')
        return
    if (len(i) == 1):
        a, b, c, d, e = i[cur.rowcount - 1]
        print("\nNome:",a,"\nData de nascimento:",b,"\nLocal de nascimento:",c,"Género:",d,"Nacionalidade:",e)
        filme = int(input("Deseja ver os filmes que ele realiza?\n1- Sim\n2- Não"))
        if (filme == 1):
            print("")
            PesquisaShort(a, 'realizador')
        else:
            return
    else:
        print('\nForam encontrados os seguintes realizadores: ')
        for n in range(len(i)):
            a, b, c, d, e = i[n]
            print(n + 1, '- ', a)

        n = int(input('\nSe desejar ver mais informacao sobre um deles insira o seu numero (0 cancela a pesquisa): '))
        print("")
        if (n == 0):
            return 0
        elif (n > cur.rowcount):
            print("Número inválido")
            return
        else:
            a, b, c, d, e = i[n - 1]
            print(' Nome: ', a, '\n Genero: ', d, '\n Data de nascimento: ', b, ' \n Local de nascimento: ', c,
                  '\n Nacionalidade: ', e)
            filme = int(input("Deseja ver os filmes que ele realiza?\n1- Sim\n2-Não"))
            if (filme == 1):
                PesquisaShort(a, 'realizador')
            else:
                return


def ProcuraProdutor(nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    nome = input("Insira o nome do Produtor: ")
    nome_pesquisa = "%" + nome + "%"

    cur.execute("SELECT * FROM produto where produtor like %s", (nome_pesquisa,))
    i = cur.fetchall()
    if (cur.rowcount == 0):
        print("Não foram encontrados produtores com esse nome")
        return
    else:
        print('Foram encontrados os seguintes produtos realizados por este produtor: ')
        for n in range(len(i)):
            num, nome_produto, produtor, detalhes, tipo, preco, validade, idade_recomendada, admin_email = i[n]
            print(n + 1, '- ', nome_produto)

    n = int(input('Se desejar ver mais informacao sobre um deles insira o seu numero (0 cancela a pesquisa): '))
    if (n == 0):
        return 0
    elif (n > cur.rowcount):
        print("Número inválido")
        return
    else:
        num, nome_produto, produtor, detalhes, tipo, preco, validade, idade_recomendada, admin_email = i[n - 1]
        print(' Nome do produto: ', nome_produto, '\n Produtor: ', produtor, '\n Sinopse: ', detalhes, ' \n Tipo: ',
              tipo,
              '\n idade_recomendada: ', idade_recomendada)


def PesquisaShort(nome, tipo):
    if (tipo == 'ator'):
        cur.execute("SELECT produto_numero_do_produto FROM ator_produto WHERE ator_nome = %s", (nome,))
        i = cur.fetchall()
        contador = 0
        count = cur.rowcount
        for linha in i:
            cur.execute("SELECT * FROM produto WHERE numero_do_produto = %s", (linha,))
            produto, = cur.fetchall()
            numero, nome_filme, produtor, detalhes, tipo, preco, validade, idaderec, admin_email = produto
            print(contador + 1, "-", nome_filme)
            contador = contador + 1

        n = int(input('\nSe desejar ver mais informacao so»bre um deles insira o seu numero (0 cancela a pesquisa): '))
        if (n == 0):
            return
        elif (n > count):
            print("\nO número introduzido nao existe")
            return
        else:
            cur.execute("SELECT * FROM produto WHERE numero_do_produto = %s", (i[n - 1],))
            filme, = cur.fetchall()
            numero, nome_filme, produtor, detalhes, tipo, preco, validade, idaderec, admin_email = filme
            print('\nNome:', nome_filme, '\nProdutor:', produtor, '\nSinopse:', detalhes, '\nTipo:', tipo,
                  '\nIdade Recomendada:', idaderec)
    if (tipo == 'realizador'):
        cur.execute("SELECT produto_numero_do_produto FROM produto_realizador WHERE realizador_nome = %s", (nome,))
        i = cur.fetchall()
        contador = 0
        count = cur.rowcount
        for linha in i:
            cur.execute("SELECT * FROM produto WHERE numero_do_produto = %s", (linha,))
            produto, = cur.fetchall()
            numero, nome_filme, produtor, detalhes, tipo, preco, validade, idaderec, admin_email = produto
            print(contador + 1, "-", nome_filme)
            contador = contador + 1

        n = int(input('\nSe desejar ver mais informacao so»bre um deles insira o seu numero (0 cancela a pesquisa): '))
        if (n == 0):
            return
        elif (n > count):
            print("\nO número introduzido nao existe")
            return
        else:
            cur.execute("SELECT * FROM produto WHERE numero_do_produto = %s", (i[n - 1],))
            filme, = cur.fetchall()
            numero, nome_filme, produtor, detalhes, tipo, preco, validade, idaderec, admin_email = filme
            print('\nNome:', nome_filme, '\nProdutor:', produtor, '\nSinopse:', detalhes, '\nTipo:', tipo,
                  '\nIdade Recomendada:', idaderec)

def VerMensagensAntigas(email_utilizador,nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    loop = True
    while (loop == True):
        cur.execute("SELECT mensagem_id FROM read_check WHERE cliente_utilizador_email = %s AND lida = TRUE ",
                    (email_utilizador,))
        i = cur.fetchall()
        counter = 0
        if (cur.rowcount == 0):
            print("\nNão tem mensagens por ler")
            return
        else:
            print("Tem", cur.rowcount, "por ler")
            for id_mensagem in i:
                cur.execute("SELECT titulo FROM mensagem WHERE id = %s", id_mensagem)
                titulo, = cur.fetchone()
                counter = counter + 1
                print(counter, "-", titulo)
            n = int(input(("")))
            if (n == 0):
                return
            elif (n > len(i)):
                print("Número inválido")
            else:
                id_mensagem = i[n - 1]
                cur.execute("SELECT mensagem FROM mensagem WHERE id = %s", (id_mensagem))
                mensagem, = cur.fetchone()
                print(mensagem)
                select = int(input("\nDeseja ver mais mensagens?\n1- Sim\n2- Não"))
                if (select == 2):
                    loop = False
                    return


def main(email_utilizador,nome):
    continuar = True
    while (continuar == True):
        print("\n***********************************")
        print("1- Listar produtos")
        print("2- Alugar um produto")
        print("3- Valor gasto em produtos")
        print("4- Ver mensagens")
        print("5- Procurar produtos com filtros")
        print("6- Pedido para aumentar o saldo")
        print("- Logout")
        print("***********************************\n")

        select = int(input(""))

        if (select == 1):
            print("1- Todos os produtos")
            print("2- Produtos alugados")
            print("- Logout")
            selecao = int(input(""))
            if (selecao == 1):
                ListarArtigos(nome)
            elif (selecao == 2):
                artigos_disponiveis(email_utilizador,nome)
            else:
                return
        elif (select == 2):
            alugar(email_utilizador,nome)

        elif (select == 3):
            Valor_gasto(email_utilizador,nome)
        elif (select == 4):
            print("1- Mensagens disponiveis")
            print("2- Mensagens antigas")
            print("- Logout")
            selecao = int(input(""))
            if (selecao == 1):
                VerMensagens(email_utilizador,nome)
            elif (selecao == 2):
                VerMensagensAntigas(email_utilizador,nome)
            else:
                return
        elif (select == 5):
            print("1- Procurar por nome")
            print("2- Procurar por ator")
            print("3- Procurar por realizador")
            print("4- Procurar por produtor")
            print("- Logout")
            selecao = int(input(""))
            if (selecao == 1):
                PesquisaFilme(nome)
            elif (selecao == 2):
                ProcurarAtor(nome)
            elif (selecao == 3):
                ProcurarRealizador(nome)
            elif (selecao == 4):
                ProcuraProdutor(nome)
            else:
                return
        elif (select == 6):
            AumentarSaldo(email_utilizador,nome)
        else:
            continuar = False
            print("***********************************\n")
            print("           See you soon              \n")
            print("***********************************")
            exit()
