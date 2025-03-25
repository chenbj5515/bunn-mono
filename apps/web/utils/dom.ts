// 格式を持つ貼り付けを避ける
export const insertPlainTextAtCursor = (plainText: string) => {
    const range = window.getSelection()?.getRangeAt(0);
    range?.deleteContents();
    const textNode = document.createTextNode(plainText);
    range?.insertNode(textNode);
}