class ContextMenu {

    #appManagerRef;

    constructor(data, appManagerRef) {
        this.theme = data.theme;
        this.build(data.items);
        this.#appManagerRef = appManagerRef;
    }

    build(options) {
        this.menu = document.createElement("menu");
        this.menu.classList.add(`context-menu-${this.theme}`);
        options.forEach((option) => this.buildOption(option));
        document.body.appendChild(this.menu);
    }

    buildOption(option) {
        const li = document.createElement("LI");
        li.classList.add(`context-menu-${this.theme}-item`);
        li.addEventListener("click", () => {option.action(); this.hide()});

        const button = document.createElement("button");
        button.classList.add(`context-menu-${this.theme}-btn`);

        const img = document.createElement("img");
        img.src = `../../img/contextMenu_icons/${option.icon}.svg`;
        img.width = 16;
        img.height = 16;

        const span = document.createElement("span");
        span.classList.add(`context-menu-${this.theme}-text`);
        span.textContent = option.name;

        button.appendChild(img);
        button.appendChild(span);
        li.appendChild(button);
        this.menu.appendChild(li);
    }

    show(x, y) {
        const w = window.innerWidth;
        const h = window.innerHeight;

        const mw = this.menu.offsetWidth;
        const mh = this.menu.offsetHeight;

        if (x + mw > w) {
            x = x - mw;
        }
        if (y + mh > h) {
            y = y - mh;
        }

        this.menu.style.left = x + "px";
        this.menu.style.top = y + "px";
        this.menu.classList.add(`show-context-menu-${this.theme}`);
    }

    hide() {
        this.menu.classList.remove(`show-context-menu-${this.theme}`);
    }

    isOpen() {
        return this.menu.classList.contains(`show-context-menu-${this.theme}`);
    }

    openContextMenu(e) {
        e.preventDefault();
        // open the menu with a delay
        const time = this.isOpen() ? 100 : 0;
        // hide the current menu (if any)
        this.hide();
        // display menu at mouse click position
        setTimeout(() => {
            this.show(e.pageX, e.pageY);
        }, time);
        // close the menu if the user clicks anywhere on the screen
        if(this.#appManagerRef.openedContextMenuRef) {
            this.#appManagerRef.openedContextMenuRef.hide();
        }
        this.#appManagerRef.openedContextMenuRef = this;
        document.addEventListener("mousedown", (e)=> this.#onMouseDown(e), {once: true});
    }

    #onMouseDown = (e) => {

        if (!e.target.className.includes("context-menu")) {

            if(this.#appManagerRef.openedContextMenuRef) {
                this.#appManagerRef.openedContextMenuRef.hide();
            }
        }
    }
}

export default ContextMenu;