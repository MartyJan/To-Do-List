var toDoList = document.getElementById("to-do-list");
var doneList = document.getElementById("done-list");
var svgNS = "http://www.w3.org/2000/svg"; //svg 命名空間
var taskList = JSON.parse(localStorage.getItem('task')) || []; //用於儲存 task 的陣列

/*modal box (custom div element)*/
class modalBox extends HTMLDivElement {
    connectedCallback() {  //call every time the element is inserted into the DOM
        self = this;
        var close = this.querySelector(".modal-close-btn");
        var modalText = this.querySelector(".modal-text");
        var save = this.querySelector(".modal-save-btn");

        //按叉叉關閉 Modal box
        close.addEventListener("click", function () {
            self.remove(); //從 DOM 移除 modal box
            document.body.style.overflow = "auto"; //將 body overflow 改為 auto
        }, false);

        //enter on click
        modalText.addEventListener("keyup", function (event) {
            if (event.key === "Enter") {
                save.click();
            }
        }, false);
    }

    getContent = function () {
        var modalText = this.querySelector(".modal-text");
        var selectTag = this.querySelector(".modal-tag");
        return { content: modalText.value.trim(), tag: selectTag.value }; //trim 可去除空白字元
    }
}

customElements.define('modal-box', modalBox, { extends: 'div' }); //自己定義新的 div tag，在 HTML 中為 <div is="modal-box">

/*建立 modal box*/
function createModalBox() {
    document.body.style.overflow = "hidden"; //modal box 出現時背景不能 scroll

    var modalBoxBackground = document.createElement("div", { is: "modal-box" });
    modalBoxBackground.classList.add("modal-container");
    var modalWindow = document.createElement("div");
    modalWindow.classList.add("modalbox");
    modalBoxBackground.appendChild(modalWindow); //.modal-container > .modalbox

    //建立打叉圖案
    var closeBtn = document.createElement("button");
    closeBtn.classList.add("modal-close-btn");
    var closeSvg = document.createElementNS(svgNS, "svg");
    closeSvg.classList.add("svg-container");
    var closePath = document.createElementNS(svgNS, "path");
    closePath.classList.add("modal-close-btn-path");
    closePath.setAttributeNS(null, "d", "M 4 4 L 16 16 M 16 4 L 4 16");
    closeSvg.appendChild(closePath); //closeSvg > closePath
    closeBtn.appendChild(closeSvg); //closeBtn > closeSvg (> closePath)

    var contentContainer = document.createElement("div");
    contentContainer.classList.add("modal-content-container");
    var modalText = document.createElement("textarea");
    modalText.classList.add("modal-text");
    var selectTag = document.createElement("select");
    selectTag.classList.add("modal-tag");
    var option1 = document.createElement("option");
    option1.value = "Personal";
    var option1Text = document.createTextNode("Personal");
    var option2 = document.createElement("option");
    option2.value = "Work";
    var option2Text = document.createTextNode("Work");
    var option3 = document.createElement("option");
    option3.value = "Others";
    var option3Text = document.createTextNode("Others");
    option1.appendChild(option1Text); //option tag > "Personal"
    option2.appendChild(option2Text); //option tag > "Work"
    option3.appendChild(option3Text); //option tag > "Others"
    selectTag.appendChild(option1); //select > option (> "Personal")
    selectTag.appendChild(option2); //select > option (> "Work")
    selectTag.appendChild(option3); //select > option (> "Others")
    contentContainer.appendChild(modalText); //.modal-content-container > textarea
    contentContainer.appendChild(selectTag); //.modal-content-container > select

    //建立 save button
    var saveBtn = document.createElement("input");
    saveBtn.type = "submit";
    saveBtn.value = "Save";
    saveBtn.classList.add("modal-save-btn");

    modalWindow.appendChild(closeBtn); //.modalbox > closeBtn
    modalWindow.appendChild(contentContainer); //.modalbox > .modal-content-container
    modalWindow.appendChild(saveBtn); //.modalbox > saveBtn
    document.body.appendChild(modalBoxBackground); //.modal-container > .modalbox

    return modalBoxBackground; //回傳 .modal-container
}

/*更新 localStorage*/
function updateLocalStorage(key, object) {
    var stringJson = JSON.stringify(object);
    localStorage.setItem(key, stringJson);
}

/*建立 custom li tag*/
class listItem extends HTMLLIElement {   //custom built-in li tag
    constructor() { //call when an instance of the element is created or upgraded
        super(); //always call super first in constructor

        //利用 constructor 在每個新增的 listItem 加上 click eventListener
        this.addEventListener("click", function (event) {
            if (this.querySelector(".checkbox-btn").contains(event.target)) {
                this.toggleCheck();
            }
            if (this.querySelector(".edit-btn").contains(event.target)) {
                this.editContent();
            }
            if (this.querySelector(".delete-btn").contains(event.target)) {
                this.deleteTask();
            }
        }, false);
    }

    //按下 checkbox 改變 list item
    toggleCheck = function () {
        var self = this;
        var checkbox = self.querySelector(".checkbox-btn"); //checkbox
        var check = self.querySelector(".check"); //打勾的 path
        var task = self.querySelector(".task-content"); //task content
        var tag = self.querySelector(".tag"); //tag
        var editBtn = self.querySelector(".edit-btn"); //edit button

        //顯示或隱藏打勾圖案
        checkbox.classList.toggle("checked");
        check.classList.toggle("checked");
        task.classList.toggle("task-content-checked"); //文字劃掉
        editBtn.classList.toggle("hidden"); //edit button 在 task 完成時不顯示

        //取得在 taskList 中對應的 index
        var index = taskList.findIndex(function (element) {
            return element.content === task.textContent && element.tag === tag.textContent;
        });

        if (checkbox.classList.contains("checked")) {
            //如果 checkbox 改為有 checked class，則移到 doneList，且 taskList 的 done 改為真
            doneList.appendChild(self);
            taskList[index].done = "true";
        }
        else { //若無，則移到 toDoList，且 taskList 的 done 要為否
            toDoList.appendChild(self);
            taskList[index].done = "false";
        }

        updateLocalStorage("task", taskList); //更新 localStorage
    }

    //更新 task content 和 tag
    editContent = function () {
        var self = this;
        var task = self.querySelector(".task-content"); //task content
        var tag = self.querySelector(".tag"); //tag
        var modal = createModalBox(); //建立 modal box
        var editText = modal.querySelector(".modal-text");
        var editTag = modal.querySelector(".modal-tag");

        //modal box 的 content 與 tag 設值為與 list item 相同
        editText.value = task.textContent;
        editTag.value = tag.textContent;

        //取得在 taskList 中對應的 index
        var index = taskList.findIndex(function (element) {
            return element.content === task.textContent && element.tag === tag.textContent;
        });

        //按儲存更新 task content 和 tag
        var save = modal.querySelector(".modal-save-btn");
        save.addEventListener("click", function () {
            var editTask = modal.getContent(); //取得 modal box 的 content 和 tag

            //改變 DOM
            toDoList.removeChild(self); //移除修改前的 li
            createList(editTask.content, editTask.tag, "false"); //建立新的 list item

            //更新 taskList
            taskList[index].content = editTask.content;
            taskList[index].tag = editTask.tag;
            updateLocalStorage("task", taskList); //更新 localStorage

            modal.querySelector(".modal-close-btn").click(); //關閉 modal box
        }, false);
    }

    //刪除 task
    deleteTask = function () {
        self = this;
        var task = self.querySelector(".task-content"); //task content
        var tag = self.querySelector(".tag"); //tag

        //取得在 taskList 中對應的 index
        var index = taskList.findIndex(function (element) {
            return element.content === task.textContent && element.tag === tag.textContent;
        });

        self.remove(); //從 DOM 中移除

        taskList.splice(index, 1); //從 taskList 中移除對應 task
        updateLocalStorage("task", taskList); //更新 localStorage
    }

}

customElements.define('list-item', listItem, { extends: 'li' }); //自己定義新的 li tag，在 HTML 為 <li is="list-item">

/*建立 list*/
function createList(taskContent, tag, done) {
    var tagSelected = document.querySelector("#tag-list .tag-selected"); //取得目前選擇 tag
    if (tag === tagSelected.textContent || tagSelected.textContent === "All") { //若 tag 符合目前選取則印出
        var listItemBox = document.createElement("li", { is: "list-item" }); //建立 custom li element

        //用 svg 畫打勾
        var checkboxBtn = document.createElement("button");
        checkboxBtn.classList.add("checkbox-btn");
        var checkSvg = document.createElementNS(svgNS, "svg"); //使用 svg 必須在命名空間 (namespace) 中，避免與 HTML 的語法搞混
        checkSvg.classList.add("svg-container");
        var checkPath = document.createElementNS(svgNS, "path");
        checkPath.classList.add("check");
        checkPath.setAttributeNS(null, "d", "M4 9 l3.5 3.5 m0 0 l7 -6.125"); //path 畫打勾 (M: move，L:line，大寫為絕對位置，小寫為相對位置)
        checkSvg.appendChild(checkPath); //checkSvg > checkPath
        checkboxBtn.appendChild(checkSvg); //checkboxBtn > checkSvg (> checkPath)

        //建立容器裝 task content & tag
        var contentContainer = document.createElement("div");
        contentContainer.classList.add("task-content-container");

        //建立 task content
        var text = document.createElement("p");
        text.classList.add("task-content");
        var content = document.createTextNode(taskContent);
        text.appendChild(content); //.task-content > text node

        //建立 tag
        var tagContainer = document.createElement("div");
        tagContainer.classList.add("tag");
        var tagName = document.createTextNode(tag);
        tagContainer.appendChild(tagName);

        contentContainer.appendChild(text); //.task-content-container > .task-content (> text node)
        contentContainer.appendChild(tagContainer); //.task-content-container > .tag (> text node)

        //用 svg 畫 edit 圖案
        var penBtn = document.createElement("button");
        penBtn.classList.add("edit-btn");
        var penSvg = document.createElementNS(svgNS, "svg");
        penSvg.classList.add("svg-container");
        var penPath = document.createElementNS(svgNS, "path");
        penPath.classList.add("options-btn-path");
        penPath.setAttributeNS(null, "d", " M 16 5 l -11 11 h -3 v -3 l 11 -11 m 0 0 q 1 -1 2.5 0.5 M 16 5 q 1 -1 -0.5 -2.5 M 15 6.5 l -3 -3"); //path 畫打勾 (M: move, L: line)
        penSvg.appendChild(penPath); //penSvg > penPath
        penBtn.appendChild(penSvg); //penBtn > penSvg (> penPath)

        //用 svg 畫 delete 圖案
        var trashCanBtn = document.createElement("button");
        trashCanBtn.classList.add("delete-btn");
        var trashCanSvg = document.createElementNS(svgNS, "svg");
        trashCanSvg.classList.add("svg-container");
        var trashCanPath = document.createElementNS(svgNS, "path");
        trashCanPath.classList.add("options-btn-path");
        trashCanPath.setAttributeNS(null, "d", "M 6 4 v -2 h 6 v 2 m 4 0 h -14 m 2 0 l 1 12 h 8 l 1 -12 m -3.5 2 v 8 m -3 0 v -8"); //path 畫打勾 (M: move, L: line)
        trashCanSvg.appendChild(trashCanPath); //trashCanSvg > trashCanPath
        trashCanBtn.appendChild(trashCanSvg); //trashCanBtn > trashCanSvg (> trashCanPath)

        //建立容器裝 edit 和 delete button
        var optionsContainer = document.createElement("div");
        optionsContainer.classList.add("options-container");
        optionsContainer.appendChild(penBtn); //.options-container > penBtn
        optionsContainer.appendChild(trashCanBtn); //.options-container > trashCanBtn

        listItemBox.appendChild(checkboxBtn); //li > .checkbox
        listItemBox.appendChild(contentContainer); //li > .task-content-container
        listItemBox.appendChild(optionsContainer); // li > .options-container

        if (done === "true") { //若 task 完成
            checkboxBtn.classList.add("checked"); //顯示打勾
            checkPath.classList.add("checked");
            text.classList.add("task-content-checked"); //文字劃掉
            penBtn.classList.add("hidden"); //禁止編輯
            doneList.appendChild(listItemBox); //list (toDoList or doneList) > li
        }
        else {
            toDoList.appendChild(listItemBox);
        }
    }
    return listItemBox; //回傳 li
}

/*選擇顯示 tag*/
var tags = document.getElementById("tag-list").children; //取得所有 tag
for (tag of tags) {
    tag.addEventListener("click", function () {
        toDoList.innerHTML = ""; //先清空 list
        doneList.innerHTML = ""; //先清空 list
        var previousSelected = document.querySelector("#tag-list .tag-selected");
        previousSelected.classList.remove("tag-selected");  //將之前所選 tag 移除 tag-selected class
        this.classList.add("tag-selected"); //將目前選取 tag 加上 tag-selected class (使用 this 表示為目前所 click)
        for (task of taskList) { //印出 list
            createList(task.content, task.tag, task.done);
        }
    }, false);

}

document.querySelector(".tag-selected").click(); //先按預設 tag

/*新增 task*/
var addTaskBtn = document.getElementById("add-new-task-btn");
addTaskBtn.addEventListener("click", function () {

    var modal = createModalBox(); //建立 modal box

    //按儲存新增 task
    var save = modal.querySelector(".modal-save-btn");
    save.addEventListener("click", function () {
        var newTask = modal.getContent(); //取得 modal box 的 content 和 tag
        var inputText = newTask.content;
        if (inputText) {  //若有輸入文字
            var tag = newTask.tag;
            //建立物件，加入 taskList
            inputObject = { content: inputText, tag: tag, done: "false" };
            taskList.push(inputObject);

            //更新 localStorage
            updateLocalStorage("task", taskList);

            //建立 list item
            createList(inputObject.content, inputObject.tag, inputObject.done);
            modal.querySelector(".modal-close-btn").click(); //關閉 modal box
        }
    }, false);
}, false);
