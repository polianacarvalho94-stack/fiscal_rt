Dim shell
Set shell = CreateObject("WScript.Shell")
shell.Run "node ""C:\Users\polia\fiscal_rt\sync.js""", 0, False
Set shell = Nothing
