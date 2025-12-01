import io
path = r'C:/Projetos/ProjetoGestao/Projeto-1/apps/front/src/App.css'
text = io.open(path, 'r', encoding='utf-8', errors='replace').read().splitlines()
print(repr(text[5506]))
