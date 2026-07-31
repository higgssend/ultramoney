import os

# Simulator.tsx
file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\Simulator.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "globalCurrency" not in content:
    content = content.replace(
        "const { clients, loans, createLoan, refinanceLoan, loanProducts } = useStore();",
        "const { clients, loans, createLoan, refinanceLoan, loanProducts, globalCurrency } = useStore();"
    )

    content = content.replace(
        "loanCategory: 'Refinanciamiento'\n    });",
        "loanCategory: 'Refinanciamiento',\n      currency: globalCurrency\n    });"
    )

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

# LoanRequest.tsx
file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\LoanRequest.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "globalCurrency" not in content:
    content = content.replace(
        "const { addLoanRequest, createLoan, deleteLoanRequest, updateClient, clients, loanRequests } = useStore();",
        "const { addLoanRequest, createLoan, deleteLoanRequest, updateClient, clients, loanRequests, globalCurrency } = useStore();"
    )

    # There is an addLoanRequest block and createLoan block.
    # We add currency: globalCurrency to both.
    content = content.replace(
        "loanType: formData.loanType\n      });",
        "loanType: formData.loanType,\n        currency: globalCurrency\n      });"
    )

    content = content.replace(
        "loanCategory: 'Nuevo'\n        });",
        "loanCategory: 'Nuevo',\n          currency: request.currency || 'DOP'\n        });"
    )

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Simulator and LoanRequest patched!")
