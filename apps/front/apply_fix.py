import io, re
path = r'C:/Projetos/ProjetoGestao/Projeto-1/apps/front/src/App.css'
text = io.open(path, 'r', encoding='utf-8', errors='replace').read()
pat = re.compile(r'\.topbar input\[type= text\],')
print('before line:', [l for l in text.splitlines() if 'topbar input' in l][-1])
new_text, n = pat.subn('.topbar input[type= text],', text)
print('replacements:', n)
io.open(path, 'w', encoding='utf-8').write(new_text)
text2 = io.open(path, 'r', encoding='utf-8', errors='replace').read()
print('after line:', [l for l in text2.splitlines() if 'topbar input' in l][-1])
print('after matches:', len(pat.findall(text2)))
