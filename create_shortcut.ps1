$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)

# Update DoragonTable shortcut
$ShortcutPath = Join-Path $DesktopPath "DoragonTable.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = """C:\Users\MakerOfSeas\Desktop\DoragonTable\DoragonTable.vbs"""
$Shortcut.WorkingDirectory = "C:\Users\MakerOfSeas\Desktop\DoragonTable"
$Shortcut.Description = "DoragonTable — Virtual Tabletop & AI Master"
$Shortcut.Save()

# Remove obsolete AiRPG shortcut if present
$OldShortcut = Join-Path $DesktopPath "AiRPG.lnk"
if (Test-Path $OldShortcut) {
    Remove-Item $OldShortcut -Force -ErrorAction SilentlyContinue
}

Write-Output "Atalho DoragonTable atualizado com sucesso na Area de Trabalho!"
