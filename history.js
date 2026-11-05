// Document transactions are independent of browser-native textarea undo.
export class EditHistory {
    #undo = [];
    #redo = [];
    #group = null;
    #lastTime = 0;

    record(before, after, group = null, now = Date.now()) {
        if (before.text === after.text) return;
        const previous = this.#undo.at(-1);
        const continues = group && group === this.#group && now - this.#lastTime < 750
            && previous?.after.text === before.text
            && previous.after.start === before.start && previous.after.end === before.end;
        if (continues) previous.after = after;
        else {
            this.#undo.push({ before, after });
            if (this.#undo.length > 100) this.#undo.shift();
        }
        this.#redo = [];
        this.#group = group;
        this.#lastTime = now;
    }

    undo() {
        this.#group = null;
        const edit = this.#undo.pop();
        if (!edit) return null;
        this.#redo.push(edit);
        return edit.before;
    }

    redo() {
        this.#group = null;
        const edit = this.#redo.pop();
        if (!edit) return null;
        this.#undo.push(edit);
        return edit.after;
    }

    get canUndo() { return this.#undo.length > 0; }
    get canRedo() { return this.#redo.length > 0; }
}
