@echo off

set /P pwd="Enter password which should be used to protect the self-signed certificate: "

powershell -command "$cert = New-SelfSignedCertificate -DnsName $env:computername -FriendlyName $env:computername -CertStoreLocation 'cert:\CurrentUser\My'; $pwd = ConvertTo-SecureString -String '%pwd%' -Force -AsPlainText; $path = 'cert:\CurrentUser\my\' + $cert.thumbprint; $filepath = (Get-Item -Path '.\').FullName; Export-PfxCertificate -cert $path -FilePath ($filepath + '\selfSignedCert.pfx') -Password $pwd" >nul

echo.
echo.
echo Dont forget to update .env file (BP_API_CERT_PW variable in it) with the same password as used here
echo.
echo.

PAUSE