import io
path = r'C:/Projetos/ProjetoGestao/Projeto-1/apps/front/src/App.css'
lines = io.open(path, 'r', encoding='utf-8', errors='replace').read().splitlines()
print('antes:', repr(lines[5506]))
lines[5506] = '.topbar input[type= text],' 
print('depois:', repr(lines[5506]))
with io.open(path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
