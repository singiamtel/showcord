```python
import os
from src import utils, constants

def main():
    print("Starting application...")

    # Load data
    data_path = os.path.join(constants.DATA_DIR, constants.DATA_FILE)
    data = utils.load_data(data_path)

    # Process data
    processed_data = utils.process_data(data)

    # Save processed data
    output_path = os.path.join(constants.OUTPUT_DIR, constants.OUTPUT_FILE)
    utils.save_data(processed_data, output_path)

    print("Application finished successfully.")

if __name__ == "__main__":
    main()
```