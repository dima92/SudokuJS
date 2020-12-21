class Sudoku {
    constructor(initString = '000000000000000000000000000000000000000000000000000000000000000000000000000000000') {
        const startValues = initString
            .split('')
            .filter(x => "0123456789".includes(x))
            .map(x => Number(x))

        this.body = []

        let idCounter = 1
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                this.body.push({
                    id: idCounter,
                    x,
                    y,
                    number: startValues[idCounter - 1],
                    selected: false,
                    supported: false,
                    important: false,
                    error: false,
                    started: startValues[idCounter - 1] === 0 ? false : true,
                    s: parseInt(y / 3) * 3 + parseInt(x / 3)
                })
                idCounter++
            }
        }
    }

    static getFreeCell(sudoku) {
        const cells = sudoku.body.filter(x => !x.number)
        const index = Math.floor(Math.random() * cells.length)

        return cells[index]
    }

    static getBusyCell(sudoku) {
        const cells = sudoku.body.filter(x => x.number)
        const index = Math.floor(Math.random() * cells.length)

        return cells[index]
    }

    static generate(n) {
        n = Math.min(81, Math.max(n, 0))

        const w = new Sudoku

        for (let i = 0; i <= 9; i++) {
            const freeCell = Sudoku.getFreeCell(w)
            freeCell.number = i
        }

        const s = w.solve()

        for (let i = 0; i < 81 - n; i++) {
            const busyCell = Sudoku.getBusyCell(s)
            busyCell.number = 0
        }

        return new Sudoku(s.body.map(x => x.number).join(''))
    }

    get isSolved() {
        for (const cell of this.body) {
            if (cell.number === 0) {
                return false
            }
        }

        for (let i = 0; i < 9; i++) {
            const row = this.getRow(i).map(x => x.number)

            for (let n = 1; n <= 9; n++) {
                if (!row.includes(n)) {
                    return false
                }
            }

            const column = this.getColumn(i).map(x => x.number)

            for (let n = 1; n <= 9; n++) {
                if (!column.includes(n)) {
                    return false
                }
            }

            const segment = this.getSegment(i).map(x => x.number)

            for (let n = 1; n <= 9; n++) {
                if (!segment.includes(n)) {
                    return false
                }
            }
        }

        return true
    }

    getCopy() {
        return new Sudoku(
            this.body.map(x => x.number).join('')
        )
    }

    getRow(n) {
        const row = []

        for (let i = 0; i < 9; i++) {
            row.push(this.body[9 * n + i])
        }

        return row
    }

    getColumn(n) {
        const column = []

        for (let i = 0; i < 9; i++) {
            column.push(this.body[i * 9 + n])
        }

        return column
    }

    getSegment(n) {
        const segment = []

        const x = n % 3
        const y = parseInt(n / 3)

        for (let dy = 0; dy < 3; dy++) {
            for (let dx = 0; dx < 3; dx++) {
                segment.push(this.body[
                y * 27 + dy * 9 + x * 3 + dx
                    ])
            }
        }
        return segment
    }

    keydownHandler(event, cell) {
        if (!cell.started) {
            if ("123456789".includes(event.key)) {
                cell.number = parseInt(event.key)

                if (cell.error) {
                    for (const item of this.body) {
                        item.error = false
                    }
                }

                for (const item of this.getRow(cell.y)) {
                    if (item === cell) {
                        continue
                    }

                    if (item.number === cell.number) {
                        item.error = true
                        cell.error = true
                    }
                }

                for (const item of this.getColumn(cell.x)) {
                    if (item === cell) {
                        continue
                    }

                    if (item.number === cell.number) {
                        item.error = true
                        cell.error = true
                    }
                }

                for (const item of this.getSegment(cell.s)) {
                    if (item === cell) {
                        continue
                    }

                    if (item.number === cell.number) {
                        item.error = true
                        cell.error = true
                    }
                }

            } else if (["Backspace", "Delete"].includes(event.key)) {
                cell.number = 0
            }

            for (const item of this.body) {
                item.important = false
            }

            if (cell.number) {
                for (const item of this.body) {
                    if (item.number === cell.number) {
                        item.important = true
                    }
                }
            }
        }

        event.preventDefault()
        this.viewUpdate()
    }

    focusHandler(event, cell) {
        cell.selected = true

        for (const item of this.getRow(cell.y)) {
            item.supported = true
        }

        for (const item of this.getColumn(cell.x)) {
            item.supported = true
        }

        if (cell.number) {
            for (const item of this.body) {
                if (item.number === cell.number) {
                    item.important = true
                }
            }
        }
        this.viewUpdate()
    }

    blurHandler(event, cell) {
        cell.selected = false

        if (cell.error) {
            cell.number = 0
        }

        for (const cell of this.body) {
            cell.important = false
            cell.supported = false
            cell.error = false
        }

        this.viewUpdate()
    }

    getHTML(size) {
        for (const cell of this.body) {
            const inputElement = document.createElement('input')
            inputElement.classList.add('sudoku-cell')
            inputElement.setAttribute("type", "text")

            inputElement.addEventListener('keydown', event => this.keydownHandler(event, cell))
            inputElement.addEventListener('focus', event => this.focusHandler(event, cell))
            inputElement.addEventListener('blur', event => this.blurHandler(event, cell))

            if (cell.started) {
                inputElement.classList.add('start-cell')
            }

            cell.element = inputElement
        }

        const rootElement = document.createElement('div')
        rootElement.classList.add("sudoku-game")
        rootElement.style.width = `${size}px`
        rootElement.style.height = `${size}px`
        rootElement.style.fontSize = `${size / 20}px`

        for (let s = 0; s < 9; s++) {
            const segmentElement = document.createElement('div')
            segmentElement.classList.add('sudoku-segment')

            for (const cell of this.getSegment(s)) {
                segmentElement.append(cell.element)
            }

            rootElement.append(segmentElement)
        }

        this.viewUpdate()

        return rootElement
    }

    viewUpdate() {
        for (const cell of this.body) {
            cell.element.classList.remove("error", "important-cell", "supported-cell", "selected-cell")
            cell.element.value = cell.number ? cell.number : ''

            if (cell.supported) {
                cell.element.classList.add("supported-cell")
            }

            if (cell.selected) {
                cell.element.classList.add("selected-cell")
            }

            if (cell.error) {
                cell.element.classList.add("error")
            }

            if (cell.important) {
                cell.element.classList.add("important-cell")
            }
        }
    }

    getPotentials() {
        const potentials = []

        for (const cell of this.body) {
            if (cell.number) {
                potentials.push(cell.number)
            } else {
                const rowNumbers = this.getRow(cell.y).map(x => x.number)
                const columnNumbers = this.getColumn(cell.x).map(x => x.number)
                const segmentNumbers = this.getSegment(cell.s).map(x => x.number)

                const alphabet = [1, 2, 3, 4, 5, 6, 7, 8, 9]

                potentials.push(
                    alphabet
                        .filter(x => !rowNumbers.includes(x))
                        .filter(x => !columnNumbers.includes(x))
                        .filter(x => !segmentNumbers.includes(x))
                )
            }
        }

        return potentials
    }

    solve() {
        const copy = this.getCopy()

        let flag = true

        while (flag) {
            flag = false

            const potentials = copy.getPotentials()

            for (let i = 0; i < 81; i++) {
                const potential = potentials[i]

                if (potential instanceof Array && potentials.length === 1) {
                    copy.body[i].number = potential[0]
                    flag = true
                }
            }
        }
        const potentials = copy.getPotentials()

        mainLoop:
            for (let power = 2; power <= 9; power++) {
                for (let i = 0; i < 81; i++) {
                    if (potentials[i].length === power) {
                        for (const value of potentials[i]) {
                            const nextCopy = copy.getCopy()
                            nextCopy.body[i].number = value

                            const resultCopy = nextCopy.solve()
                            if (resultCopy.isSolved) {
                                return resultCopy
                            }
                        }
                        break mainLoop
                    }
                }
            }

        return copy
    }
}
