import psycopg2
from passlib.hash import sha256_crypt

conn = psycopg2.connect("host=localhost dbname=projeto user=postgres password=postgres")
cur = conn.cursor()




def encriptar(password):
    password_encriptada = sha256_crypt.hash(password)
    return(password_encriptada);

def main():
    loop = False

    while(loop == False):  #Se o utilizador meter @ na primeira vez e . na segunda o programa deixa passar
        utilizador_email = input('Email: ')
        at = False
        for i in range(len(utilizador_email)):
            if(utilizador_email[i] == '@'):
                at = True
            if(at == True):
                if(utilizador_email[i] == '.'):
                    loop = True



    utilizador_password = input('Password: ')
    utilizador_password = encriptar(utilizador_password)

    utilizador_nome = input('Nome: ')
    utilizador_idade = int(input('Idade: '))


    cur.execute("INSERT INTO utilizador (email, password, nome, idade) VALUES (%s,%s,%s,%s)", (utilizador_email, utilizador_password, utilizador_nome, utilizador_idade))

    cur.execute("SELECT * FROM cliente")

    id_de_utilizador = cur.rowcount + 1

    cur.execute("INSERT INTO cliente (Saldo,id_de_utilizador,utilizador_email) VALUES (20,%s,%s)",(id_de_utilizador, utilizador_email))
    conn.commit()
    cur.close()
    conn.close()


