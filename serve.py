#!/usr/bin/env python3
"""
Servidor de desarrollo con live reload para pac2/.
Recarga el navegador automáticamente al guardar cualquier archivo.
Uso: python serve.py
"""
from livereload import Server

server = Server()
server.watch('*.html')
server.watch('css/*.css')
server.watch('js/*.js')
server.watch('media/*')

print("Servidor live reload en http://localhost:8080")
server.serve(root='.', port=8080, host='localhost', open_url_delay=1)
