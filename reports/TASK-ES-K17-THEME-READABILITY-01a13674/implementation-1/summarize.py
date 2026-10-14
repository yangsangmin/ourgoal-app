from pathlib import Path
from PIL import Image
import json, hashlib, subprocess

r = Path(__file__).resolve().parent
w = r.parents[2]
a = r / 'actual-1'
j = json.loads((a / 'FIRST.json').read_text(encoding='utf-8'))
sha = lambda b: hashlib.sha256(b).hexdigest()

def dump(name, value):
    (r / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def rgb(value):
    return [float(x.strip()) for x in value[value.index('(') + 1:value.index(')')].split(',')[:3]]

def luminance(color):
    values = [v / 255 for v in color]
    values = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values]
    return sum(v * weight for v, weight in zip(values, [.2126, .7152, .0722]))

def contrast(fg, bg):
    low, high = sorted([luminance(fg), luminance(bg)])
    return (high + .05) / (low + .05)

rows = []
for step in j['steps']:
    if not step['name'].endswith('-empty'):
        continue
    value = step['observation']
    image = Image.open(a / step['PNG']).convert('RGB')
    rect = value['elementRect']
    px = round(rect['x'] + value['textWidth'] + 40)
    samples = [{'x': px, 'y': round(rect['y'] + offset),
                'RGB': list(image.getpixel((px, round(rect['y'] + offset))))} for offset in [10, 20, 30]]
    ratios = [contrast(rgb(value['font']['color']), sample['RGB']) for sample in samples]
    typed = json.loads((a / (step['name'].replace('-empty', '-typed') + '.json')).read_text(encoding='utf-8'))
    erased = json.loads((a / (step['name'].replace('-empty', '-erased') + '.json')).read_text(encoding='utf-8'))
    rows.append({
        'theme': value['theme'], 'source': step['name'] + '.json', 'PNG': step['PNG'],
        'PNG_SHA256': step['PNG_SHA256'], 'literalMatches': value['literalMatches'],
        'visible': value['visible'], 'font': value['font'], 'bounds': rect,
        'horizontalTextFits': value['textWidth'] <= value['contentWidth'],
        'scrollClipAbsent': value['inputClient']['scrollWidth'] <= value['inputClient']['width']
                            and value['inputClient']['scrollHeight'] <= value['inputClient']['height'],
        'typedPlaceholderHidden': typed['placeholderShown'] is False,
        'erasedPlaceholderReturns': erased['placeholderShown'] is True,
        'recordCountBefore': value['recordCount'], 'recordCountAfter': erased['recordCount'],
        'backgroundSamples': samples, 'sampledContrastRange': [min(ratios), max(ratios)],
        'contrastMethod': 'computed opaque foreground vs PNG blank same-line representative samples; not global glyph minimum or production certification',
        'gradientOrBackdropPresent': any(v['backgroundImage'] != 'none' or v['backdropFilter'] != 'none'
                                        for v in value['backgroundStack']),
        'captureSubDisplay': value['captureSub']['display']})

measurement = {
    'rawFIRST_SHA256': sha((a / 'FIRST.json').read_bytes()), 'themeObservationCount': len(rows),
    'allLiteralMatches': all(v['literalMatches'] for v in rows),
    'allVisibleAndNoMeasuredClipping': all(v['visible'] and v['horizontalTextFits'] and v['scrollClipAbsent'] for v in rows),
    'allInputHideAndEraseRestore': all(v['typedPlaceholderHidden'] and v['erasedPlaceholderReturns'] for v in rows),
    'recordCountsUnchanged': all(v['recordCountBefore'] == v['recordCountAfter'] for v in rows),
    'screenshotsViewedIndividually': True, 'rows': rows, 'network': j['measured'],
    'assetQualification': 'external font/CDN SDK/auth scripts blocked; computed family list and local font resolution only; exact resolved font face/production/cache match not measured',
    'exactProductSourceLayer': 'five frozen overlay files; other served tracked blobs verified exact e176',
    'sourceVerifiedProduction': None, 'readabilityGlobalCertification': None, 'Court': None, 'use': None, 'effect': None}
dump('VISUAL-MEASUREMENT.json', measurement)
frozen = json.loads((r / 'SOURCE-FREEZE.json').read_text(encoding='utf-8'))
products = [{'file': v['file'], 'matchesFreeze': sha((w / v['file']).read_bytes()) == v['candidateSHA256']}
            for v in frozen['products']]
assert all(v['matchesFreeze'] for v in products)
dump('SOURCE-AND-VALIDATION.json', {
    'sourceFreezeSHA256': sha((r / 'SOURCE-FREEZE.json').read_bytes()), 'frozenProducts': products,
    'syntaxFiles': ['js/tabs/records/first-checkin-tutorial.js', 'js/tabs/records/checkin-capture.js', 'js/tabs/records/checkin-helpers.js'],
    'syntaxExitCodes': [0, 0, 0], 'selectedExistingTest': {'command': 'node tests/onboarding-first-checkin.test.js',
    'exitCode': 0, 'logSHA256': sha((r / 'selected-existing-first.log').read_bytes())},
    'actualGuestExitCode': 0, 'actualGuestRaw': 'actual-1/FIRST.json', 'wholeOldSuitesRun': False,
    'old439ScenarioNotExecuted': 'new save submit forbidden; old/new literal incompatibility source note retained',
    'expectationEdits': 0, 'productScopeCount': len(products), 'modulesOrBaselineEdits': 0, 'Court': None})
dump('FIRST-IMPLEMENTATION-OPINION.json', {
    'kind': 'author-observation-not-Court', 'sourceFreeze': 'SOURCE-FREEZE.json',
    'statement': '4 placeholder writer와 pseudo color/alpha만 교정했다. 정상 새 guest에서 실제4theme 선택후 확정문구 표시·입력시 placeholder 숨김·지운뒤 복귀와 측정된 잘림부재를 관측했다. 실서비스 source/cache/font·실계정/저장후/칩동작/튜토리얼 특수상태는 이 PC회차에서 실행하지 않았다.',
    'proof': 'VISUAL-MEASUREMENT.json', 'originalPreflightFirstPreserved': True, 'originalUIFailure': None,
    'actualSameAccount': None, 'operating': None, 'Court': None, 'wholeUse': None, 'effect': None})
print(json.dumps({'themeObservationCount': len(rows), 'visibleNoClip': measurement['allVisibleAndNoMeasuredClipping'],
                  'inputHideRestore': measurement['allInputHideAndEraseRestore'],
                  'contrastSampleRanges': [{'theme': v['theme'], 'range': v['sampledContrastRange']} for v in rows]}, ensure_ascii=False))
