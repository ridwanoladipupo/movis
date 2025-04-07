import pandas as pd
import numpy as np
from scipy.signal import butter, filtfilt
from sklearn.preprocessing import MinMaxScaler

# Load dataset
file_path = "./data/all_activity_data.csv"  # Adjust path if needed
df = pd.read_csv(file_path)

# Display basic info
print(df.head())  # Show first few rows
print(df.info())  # Check data types and missing values

df.dropna(inplace=True)  # Removes rows with missing values


def butter_lowpass_filter(data, cutoff=5, fs=50, order=4):
    nyquist = 0.5 * fs
    normal_cutoff = cutoff / nyquist
    b, a = butter(order, normal_cutoff, btype='low', analog=False)
    return filtfilt(b, a, data)

# Apply filter to each sensor axis
df["Accel_X_filtered"] = butter_lowpass_filter(df["Accel_X"])
df["Accel_Y_filtered"] = butter_lowpass_filter(df["Accel_Y"])
df["Accel_Z_filtered"] = butter_lowpass_filter(df["Accel_Z"])

# Normalize filtered data
scaler = MinMaxScaler()
df[["Accel_X_filtered", "Accel_Y_filtered", "Accel_Z_filtered"]] = scaler.fit_transform(
    df[["Accel_X_filtered", "Accel_Y_filtered", "Accel_Z_filtered"]]
)

# Compute motion intensity
df["motion_intensity"] = np.sqrt(
    df["Accel_X_filtered"]**2 + df["Accel_Y_filtered"]**2 + df["Accel_Z_filtered"]**2
)

# Save processed data
df.to_csv("./data/processed_all_activity_data.csv", index=False)

# print(df.head())
# print(df.columns)
# print(df.describe())
