import os
from looker_project_vars import (
    project_id,
    dataset_id,
    examples_table_id,
    examples_folder,
)
from utils_bigquery import (
    get_bigquery_client,
    delete_existing_rows,
    load_data_from_file,
    insert_data_into_bigquery,
)


def load_examples(examples_folder):
    client = get_bigquery_client(project_id)
    delete_existing_rows(client, project_id, dataset_id, examples_table_id)

    # Iterate over model folders inside examples_folder
    for model_folder in os.listdir(examples_folder):
        model_path = os.path.join(examples_folder, model_folder)
        if os.path.isdir(model_path):
            # Iterate over files inside the model folder
            for file_name in os.listdir(model_path):
                explore = os.path.splitext(file_name)[0]
                explore_id = f"{model_folder}:{explore}"
                data = load_data_from_file(os.path.join(model_path, file_name))
                insert_data_into_bigquery(
                    client, dataset_id, examples_table_id, explore_id, data, "examples"
                )


if __name__ == "__main__":
    load_examples(examples_folder)
