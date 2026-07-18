'use strict';

const englishReplacements = new Map([
  ['タッチ操作または十字キーでプレイできます。', 'Play with the touch controls or arrow keys.'],
]);

function translateDynamicUi() {
  const overlayText = document.getElementById('overlayText');
  if (!overlayText) return;

  const current = overlayText.textContent.trim();
  if (englishReplacements.has(current)) {
    overlayText.textContent = englishReplacements.get(current);
    return;
  }

  const scoreMatch = current.match(/^スコア\s+([\d,]+)。もう一度挑戦しますか？$/);
  if (scoreMatch) {
    overlayText.textContent = `Score: ${scoreMatch[1]}. Play again?`;
  }
}

translateDynamicUi();

const overlayText = document.getElementById('overlayText');
if (overlayText) {
  new MutationObserver(translateDynamicUi).observe(overlayText, {
    childList: true,
    characterData: true,
    subtree: true,
  });
}
