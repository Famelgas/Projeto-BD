import psycopg2
from datetime import datetime
conn = psycopg2.connect("host=localhost dbname=projeto user=postgres password=postgres")
cur = conn.cursor()

def NovoAtor(nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    ator_nome = input('Nome do ator: ')

    ator_data_nascimento = input('Data de nascimento(dd-mm-yy): ')

    ator_local_de_nascimento = input('Local de nascimento: ')

    ator_genero = input('Genero: ')

    ator_nacionalidade = input('Nacionalidade: ')

    cur.execute("INSERT INTO ator (nome, data_nascimento, local_de_nascimento, genero, nacionalidade) VALUES (%s,%s,%s,%s,%s)", (ator_nome,  ator_data_nascimento, ator_local_de_nascimento, ator_genero, ator_nacionalidade))

    conn.commit()

def NovoProduto(nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    cur.execute("SELECT numero_do_produto FROM produto")

    numero_do_produto = cur.rowcount + 1

    nome_do_produto = input("Insira o nome do produto: ")

    produtor = input("Nome do produtor: ")

    detalhes = input("insira os detalhes do produto (sinopse):")

    tipo = input("Tipo: ")

    preco = float(input("Preço: "))

    validade = input("Validade (Meses): ")

    idade_recomendada = input("Idade recomendada: ")

    cur.execute("SELECT utilizador_email FROM administrador")

    administrador = str(cur.fetchall())
    administrador = administrador.split("'")

    cur.execute("INSERT INTO produto  VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)", (
    numero_do_produto, nome_do_produto, produtor, detalhes, tipo, preco, validade, idade_recomendada, administrador[1]))

    conn.commit()
    # associar atores e realizadores ao produto

    numero_atores = int(input("Quantos atores participam no Filme/Serie?"))

    while (numero_atores <= 0):
        print('Um Filme/Serie tem que ter pelo menos um ator')
        numero_atores = int(input("Quantos atores participam no Filme/Serie?"))

    for i in range(numero_atores):
        ator = input("Nome de um ator: ")
        cur.execute("INSERT INTO ator_produto VALUES (%s,%s)", (ator, numero_do_produto))

    numero_realizadores = int(input("Quantos realizadores ajudaram na realizaçao do Filme/Serie?"))

    while (numero_realizadores <= 0):
        print('Um Filme/Serie tem que ter pelo menos um realizador')
        numero_realizadores = int(input("Quantos realizadores ajudaram na realizaçao do Filme/Serie?"))

    for i in range(numero_realizadores):
        realizador = input("Nome de um realizador: ")
        cur.execute("INSERT INTO produto_realizador VALUES (%s,%s)", (numero_do_produto, realizador))

    conn.commit()

def NovoRealizador(nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    realizador_nome = input('Nome do realizador: ')

    realizador_data_nascimento = input('Data de nascimento(dd-mm-yy): ')

    realizador_local_de_nascimento = input('Local de nascimento: ')

    realizador_genero = input('Genero: ')

    realizador_nacionalidade = input('Nacionalidade: ')

    cur.execute(
        "INSERT INTO Realizador (nome, data_de_nascimento, local_de_nascimento, genero, nacionalidade) VALUES (%s,%s,%s,%s,%s)",
        (realizador_nome, realizador_data_nascimento, realizador_nacionalidade, realizador_genero,
         realizador_nacionalidade))

    conn.commit()
def VisualizarArtigos(nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    cur.execute("SELECT nome_do_produto,preco,idade_recomendada FROM produto")
    i = 0
    for linha in cur.fetchall():
        nome,preco,idade = linha
        i = i+1
        print(i,"-",nome,"\n\t\tPreço por mês:",preco,"\n\t\tCondições de aluguer:",idade,"anos")

def RemoverArtigo(nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    nome_artigo_remover = input("Insira o nome do artigo que deseja remover: ")
    nome_artigo_remover =nome_artigo_remover
    cur.execute("SELECT numero_do_produto FROM produto WHERE nome_do_produto = %s",(nome_artigo_remover,))
    numero_artigo_remover, = cur.fetchall()
    cur.execute("SELECT produto_numero_do_produto FROM aluguer WHERE produto_numero_do_produto = %s ",(numero_artigo_remover,))
    if(cur.rowcount > 0):
        print("Este produto já foi alugado e não pode ser removido")
        return
    else:
        cur.execute("DELETE FROM ator_produto WHERE produto_numero_do_produto = %s",(numero_artigo_remover,))
        cur.execute("DELETE FROM produto_realizador WHERE produto_numero_do_produto = %s",(numero_artigo_remover,))
        cur.execute("DELETE FROM produto WHERE numero_do_produto = %s",(numero_artigo_remover,))
        conn.commit()
        print("O artigo foi removido com sucesso")

def MensagemGlobal(email_login,nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    titulo = str(input("Insira o tirulo da sua mensagem"))
    mensagem = str(input("Digite a sua mensagem: "))
    data_presente = datetime.now()
    lida = False
    email_admin = email_login
    cur.execute("SELECT id FROM mensagem ")

    id_mensagem = cur.rowcount + 1

    cur.execute("INSERT INTO mensagem VALUES (%s,%s,%s,%s,%s) ", (id_mensagem, titulo, mensagem, data_presente, email_admin))
    cur.execute("SELECT utilizador_email FROM cliente")
    check = 0
    check_utilizadores = cur.rowcount
    for email_envio in cur.fetchall():
        cur.execute("INSERT INTO read_check VALUES (%s,%s,%s)",(lida, id_mensagem, email_envio,))
        check = check + 1
    if check == check_utilizadores:
        print("A mensagem foi enviada a todos os clientes (",check,"de",check_utilizadores,")")
        conn.commit()
    else:
        print("Não foi possivel concluir o envio da mensagem, foi enviada a",check,"clientes de",check_utilizadores)

def MensagemUnica(email_login,nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    mensagem = str(input("Digite a sua mensagem: "))
    titulo = str(input("Insira o titulo da sua mensagem"))
    data_presente = datetime.now()
    lida = False
    email_admin = email_login
    cur.execute("SELECT id FROM mensagem ")
    id_mensagem = cur.rowcount + 1

    cur.execute("INSERT INTO mensagem VALUES (%s,%s,%s,%s,%s) ", (id_mensagem,titulo, mensagem, data_presente, email_admin))
    email_envio= input("A quem deseja enviar a mensagem (email do cliente)")
    cur.execute("SELECT utilizador_email FROM cliente WHERE  utilizador_email = %s",(email_envio,))
    if(cur.rowcount == 1):
        cur.execute("INSERT INTO read_check VALUES (%s,%s,%s)",(lida, id_mensagem, email_envio,))
        conn.commit()
        print("A mensagem foi enviada com sucesso")
    else:
        print("Este utilizador não existe")

def AumentarSaldo(nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    cur.execute("SELECT mensagem_id FROM read_check WHERE (cliente_utilizador_email = 'mensagem@admin.pt' AND lida = FALSE)")
    if cur.rowcount > 0:
        print("Tem", cur.rowcount,"pedidos para aumentar o saldo")
        cont = 0

        for selecionado in cur.fetchall():
            cur.execute("SELECT id,mensagem FROM mensagem WHERE id = %s",(selecionado,))
            for idmensagem in cur.fetchall():
                id, mensagem = idmensagem
                print(mensagem)
                print("1- Adicionar")
                print("2- Não adicionar")
                print("-Sair")
                adicionar = int(input(""))
                print(mensagem)
                if(adicionar == 1):
                    mensagem = mensagem.split(',')
                    print(mensagem)
                    email = str(mensagem[3])
                    saldo = mensagem[1]
                    cur.execute("UPDATE cliente SET saldo = saldo + %s WHERE utilizador_email = %s",(saldo,email))
                    cur.execute("UPDATE read_check SET lida = TRUE WHERE cliente_utilizador_email = %s",(email,))

                    print('O saldo foi adicionado à conta')
                    conn.commit()
                elif(adicionar == 2):
                    cur.execute("SELECT administrador_utilizador_email FROM mensagem where id=%s",(id,))
                    email, = cur.fetchall()
                    cur.execute("UPDATE read_check SET lida = TRUE WHERE cliente_utilizador_email = 'mensagem@admin.pt'")
                    conn.commit()
                else:
                    return
    else:
        print("Não tem pedidos para aumentar o saldo")
        return
def MudarPreco(nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    data_presente = datetime.now()
    alterado = float(input("Alteração de preço: "))
    nome_produto = str(input(("Insira o nome do produto: ")))
    cur.execute("SELECT numero_do_produto,preco FROM produto WHERE nome_do_produto = %s",(nome_produto,))
    produto, = cur.fetchall()
    id, preco, = produto
    cur.execute("INSERT INTO historico VALUES (%s,%s,%s)",(preco,data_presente,id))
    cur.execute("UPDATE produto SET preco = %s WHERE numero_do_produto = %s",(alterado,id))
    conn.commit()
    print("O preço foi alterado com sucesso")

def VerEstatisticas(nome):
    print("***********************************")
    print("utilizador:", nome)
    print("***********************************")
    cur.execute("SELECT * FROM cliente")
    total_clientes = cur.rowcount
    cur.execute("SELECT preco FROM aluguer")
    valor_total = 0
    quantidade_alugueres = cur.rowcount
    for linha in cur.fetchall():
        preco, = linha
        valor_total = preco + valor_total
    valor_medio = valor_total/cur.rowcount
    cur.execute("SELECT tipo FROM produto ")
    tipo_serie = 0
    tipo_filme = 0
    for tipo in cur.fetchall():
        tipo, = tipo
        tipo_ = tipo.split(',')
        if(tipo_[0] == 'Series'):
            tipo_serie = tipo_serie + 1
        elif(tipo_[0] == 'Movie'):
            tipo_filme = tipo_filme + 1

    cur.execute("SELECT idade FROM utilizador")
    idade_media = 0
    for idade in cur.fetchall():
        idade, = idade
        idade_media = idade_media + idade
    idade_media = idade_media/(cur.rowcount - 1)

    print("\nTotal de clientes:", total_clientes,"\nQuantidade de alugueres:",quantidade_alugueres,"\nValor total de alugueres:",valor_total,"\nValor medio de aluguer:",valor_medio,"\nQuantidade de filmes:",tipo_filme,"\nQuantidade de series:",tipo_serie,"\nIdade média: ",idade_media)




def main(email_login,nome):
    continuar = True
    while(continuar == True):
        print("***********************************")
        print("utilizador:",nome)
        print("***********************************")
        print("1- Adicionar um novo ator à base de dados")
        print("2- Adicionar um novo produto à base de dados")
        print("3- Adicionar um novo realizador à base de dados")
        print("4- Visualizar todos os produtos com preço e condições de aluguer")
        print("5- Remover um artigo")
        print("6- Enviar mensagem para todos os clientes")
        print("7- Enviar mensagem a uma só pessoa")
        print("8- Aumentar o saldo")
        print("9- Mudar o preço de um artigo")
        print("10- Ver estatísticas")
        print("- Sair")
        print("***********************************\n")


        select = int(input(""))

        if(select == 1):
            NovoAtor(nome)
        elif(select == 2):
            NovoProduto(nome)
        elif(select == 3):
            NovoRealizador(nome)
        elif(select == 4):
            VisualizarArtigos(nome)
        elif(select == 5):
            RemoverArtigo(nome)
        elif(select == 6):
            MensagemGlobal(email_login,nome)
        elif(select == 7):

            MensagemUnica(email_login,nome)
        elif(select == 8):
            AumentarSaldo(nome)
        elif(select == 9):
            MudarPreco(nome)
        elif(select == 10):
            VerEstatisticas(nome)
        else:
            continuar = False
            print("***********************************\n")
            print("           See you soon              \n")
            print("***********************************")
            exit()