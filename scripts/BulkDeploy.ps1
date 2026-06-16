param([Parameter(Mandatory)][string[]]$ComputerName,[Parameter(Mandatory)][string[]]$Apps,[string]$ApiBaseUrl="http://localhost:4000")
$scriptBlock = { param($Apps,$ApiBaseUrl) iwr "$ApiBaseUrl/scripts/WinRepoClient.ps1" -UseBasicParsing | iex; foreach($app in $Apps){ Install-App $app } }
Invoke-Command -ComputerName $ComputerName -ScriptBlock $scriptBlock -ArgumentList (,$Apps),$ApiBaseUrl
