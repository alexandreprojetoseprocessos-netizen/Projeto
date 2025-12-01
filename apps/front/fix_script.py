import io, re
path = r'C:/Projetos/ProjetoGestao/Projeto-1/apps/front/src/App.css'
text = io.open(path, 'r', encoding='utf-8', errors='replace').read().splitlines()
print([i for i,l in enumerate(text) if 'topbar input' in l])
if text:
    idxs = [i for i,l in enumerate(text) if 'topbar input' in l]
    if idxs:
        text[idxs[-1]] = '.topbar input[type= text],'  # fix last occurrence
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(text))
