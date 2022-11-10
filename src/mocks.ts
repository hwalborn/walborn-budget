import { sheets_v4 } from "googleapis"

export const mockEarnings = {
    "range": "Earnings!A2:D100",
    "majorDimension": "ROWS",
    "values": [
      [
        " $ 2,500.00 ",
        "CK",
        "Begbal"
      ],
      [
        " $ (1,000.00)",
        "CC",
        "Begbal"
      ],
      [
        " $ 10,000.00 ",
        "SAV",
        "Begbal"
      ],
      [
        " $ 2,500.00 ",
        "CK",
        "Holt Pay",
        "WORK"
      ],
      [
        " $ (100.00)",
        "CK",
        "Cash out"
      ],
      [
        " $ 100.00 ",
        "CASH",
        "Cash in"
      ]
    ]
  }

export const mockExpenses = {
    "range": "Daily!C16:E26",
    "majorDimension": "ROWS",
    "values": [
      [
        "  (2,000.00)",
        "  500.00 ",
        "RU"
      ],
      [
        "  (301.56)",
        "  (2.56)",
        "GA"
      ],
      [
        "  (103.38)",
        "  (3.38)",
        "SHOP"
      ],
      [
        "  (163.16)",
        "  (63.16)",
        "RB"
      ],
      [
        "  -   ",
        "  -   ",
        "ENT"
      ],
      [
        "  (45.96)",
        "  4.04 ",
        "TRAV"
      ],
      [
        "  (8.25)",
        "  6.75 ",
        "TRANS"
      ],
      [
        "  -   ",
        "  -   ",
        "CELL"
      ],
      [
        "  -   ",
        "  -   ",
        "SL"
      ],
      [
        "  -   ",
        "  -   ",
        "MD"
      ],
      [
        "  (103.00)",
        "  (28.00)",
        "MISC"
      ]
    ]
  }

export const mockBalances = {
    "range": "Daily!B3:C6",
    "majorDimension": "ROWS",
    "values": [
      [
        "  2,259.69 ",
        "  (60.00)"
      ],
      [
        "  10,000.00 ",
        "  -   "
      ],
      [
        "  100.00 ",
        "  -   "
      ],
      [
        "  (1,000.00)",
        "  (25.00)"
      ]
    ]
  }

// just to keep from calling google sheets API over and over
export const mockSheetsBatch = (): Promise<sheets_v4.Schema$ValueRange[]> => {
    return Promise.resolve([mockExpenses, mockBalances, mockEarnings])
}