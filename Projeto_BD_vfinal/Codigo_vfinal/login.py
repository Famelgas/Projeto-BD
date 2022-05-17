#
# Nao ligar a este ficheiro foi so feito para plear como seria feito o login por isso variaveis como conta nao serao
# necessarias no futuro

import psycopg2
import Utilizador
import Administrador
import NovoUtilizador
from passlib.hash import sha256_crypt


def verificar_login_cliente(email_login, password_login,login):

    cur.execute("SELECT email,password FROM utilizador WHERE email=%s",(email_login,))

    for linha in cur.fetchall():
        email, password = linha

        if(email_login == email):
            if(sha256_crypt.verify(password_login, password) == True):
                login = True
                print('Login sucessfull')

            else:
                login = False
                print('Wrong email or password')
    if(login == True):
        cur.execute("SELECT nome FROM utilizador WHERE email = %s",(email_login,))
        nome, = cur.fetchall()
        nome, = nome
        Utilizador.main(email_login,nome)
    elif(login == False):
        print("Utilizador/Password inexistentes ou errados")
        return

def verificar_login_administrador(email_login, password_login,login):

    cur.execute("SELECT utilizador_email FROM administrador WHERE utilizador_email = %s",(email_login,))
    for email in cur.fetchall():
        email_administrador, = email
        if (email_login == email_administrador):
            cur.execute("SELECT password FROM utilizador WHERE email = %s", (email_login,))
            for password in cur.fetchall():
                password_administrador, = password
                if (sha256_crypt.verify(password_login, password_administrador) == True):
                    login = True
                    print('Login sucessfull')
                else:
                    login = False
                    print('Wrong email or password')
    if(login == True):
        cur.execute("SELECT nome FROM utilizador WHERE email = %s",(email_login,))
        nome, = cur.fetchall()
        nome, = nome
        Administrador.main(email_login,nome)
    elif(login == False):
        print("Utilizador/Password inexistentes ou errados")
        return

login = False
conn = psycopg2.connect("host=localhost dbname=projeto user=postgres password=postgres")
cur = conn.cursor()
print("***********************************")
print("1- Login como cliente")
print("2- Login como administrador")
print("3- Criar conta")
print("4- Sair")
print("***********************************\n")
opcao = int(input(''))

if(opcao == 1):
    loop = False
    while (loop == False):  # Se o utilizador meter @ na primeira vez e . na segunda o programa deixa passar
        email_login = input('Email: ')
        at = False
        for i in range(len(email_login)):
            if (email_login[i] == '@'):
                at = True
            if (at == True):
                if (email_login[i] == '.'):
                    loop = True

    password_login = input("Password: ")
    verificar_login_cliente(email_login, password_login, login)

elif(opcao == 2):
    loop = False
    while (loop == False):  # Se o utilizador meter @ na primeira vez e . na segunda o programa deixa passar
        email_login = input('Email: ')
        at = False
        for i in range(len(email_login)):
            if (email_login[i] == '@'):
                at = True
            if (at == True):
                if (email_login[i] == '.'):
                    loop = True

    password_login = input("Password: ")
    verificar_login_administrador(email_login, password_login,login)

elif(opcao == 3):
    NovoUtilizador.main()

cur.close()
conn.close()
