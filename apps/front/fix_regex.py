import io, re
path = r'C:/Projetos/ProjetoGestao/Projeto-1/apps/front/src/App.css'
text = io.open(path, 'r', encoding='utf-8', errors='replace').read()
text_new = re.sub(r'\.topbar input\[type= text\],', '.topbar input[type= text],', text)
io.open(path, 'w', encoding='utf-8').write(text_new)
