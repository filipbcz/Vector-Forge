import argparse


def main() -> None:
    parser = argparse.ArgumentParser(description="Testovací skript Vector Forge")
    parser.add_argument("--name", default="", help="Volitelné jméno pro pozdrav")
    args = parser.parse_args()

    sName = (args.name or "").strip()
    if sName:
        print(f"Ahoj, {sName}")
    else:
        print("Vector Forge online")


if __name__ == "__main__":
    main()
