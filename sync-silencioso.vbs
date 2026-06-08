' Inicia o sync em background sem abrir nenhuma janela
Dim shell
Set shell = CreateObject("WScript.Shell")
shell.Run "node ""C:\Users\polia\OneDrive\Área de Trabalho\meu-site\sync.js""", 0, False
Set shell = Nothing
