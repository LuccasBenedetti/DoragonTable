$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)

# Target shortcut directly to electron.exe with '.' as argument
$ShortcutPath = Join-Path $DesktopPath "DoragonTable.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "C:\Users\MakerOfSeas\Desktop\DoragonTable\node_modules\electron\dist\electron.exe"
$Shortcut.Arguments = "."
$Shortcut.WorkingDirectory = "C:\Users\MakerOfSeas\Desktop\DoragonTable"
$Shortcut.Description = "DoragonTable — Virtual Tabletop & AI Master"
$Shortcut.IconLocation = "C:\Users\MakerOfSeas\Desktop\DoragonTable\node_modules\electron\dist\electron.exe,0"
$Shortcut.Save()

Write-Output "Atalho DoragonTable configurado com sucesso!"
