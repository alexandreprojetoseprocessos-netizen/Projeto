import io, re
path = r'C:/Projetos/ProjetoGestao/Projeto-1/apps/front/src/App.css'
text = io.open(path, 'r', encoding='utf-8', errors='replace').read()
pat = re.compile(r'\.topbar input\[type= text\],')
print('found', bool(pat.search(text)))
print('count', len(pat.findall(text)))
