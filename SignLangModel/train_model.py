import pickle
import numpy as np # type: ignore
from sklearn.ensemble import RandomForestClassifier # type: ignore
from sklearn.model_selection import train_test_split # type: ignore
from sklearn.metrics import accuracy_score # type: ignore

# Load preprocessed data
data_dict = pickle.load(open('data.pickle', 'rb'))

data = np.asarray(data_dict['data'])
labels = np.asarray(data_dict['labels'])

# Split the dataset into training and testing sets
x_train, x_test, y_train, y_test = train_test_split(data, labels, test_size=0.2, shuffle=True, stratify=labels)

# Train the model
model = RandomForestClassifier()
model.fit(x_train, y_train)

# Evaluate the model
y_predict = model.predict(x_test)
score = accuracy_score(y_test, y_predict)
print(f'{score * 100}% of samples were classified correctly!')

# Save the model
with open('model.p', 'wb') as f:
    pickle.dump({'model': model}, f)
