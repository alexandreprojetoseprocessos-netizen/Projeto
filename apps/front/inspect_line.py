import io
path = r'C:/Projetos/ProjetoGestao/Projeto-1/apps/front/src/App.css'
lines = io.open(path, 'r', encoding='utf-8', errors='replace').read().splitlines()
line = lines[5506]
print(repr(line))
print([hex(ord(ch)) for ch in line])
