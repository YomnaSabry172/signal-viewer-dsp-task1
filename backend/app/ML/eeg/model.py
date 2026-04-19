import torch
import torch.nn as nn
from braindecode.models import BIOT

def load_biot_model(weights_path, num_classes=6):
    # Determine if the server has a GPU, otherwise fallback to CPU
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Load the base 16-channel model
    model = BIOT.from_pretrained("braindecode/biot-pretrained-prest-16chs")
    
    # Dynamically find and replace the final layer (just like in Kaggle)
    modules = list(model.named_modules())
    for i in range(len(modules) - 1, -1, -1):
        name, module = modules[i]
        if isinstance(module, nn.Linear):
            parent_name = name.rsplit('.', 1)[0] if '.' in name else ''
            child_name = name.rsplit('.', 1)[-1] if '.' in name else name
            
            parent_module = model
            if parent_name:
                for part in parent_name.split('.'):
                    parent_module = getattr(parent_module, part)
            
            setattr(parent_module, child_name, nn.Linear(module.in_features, num_classes))
            break
            
    # Load your fine-tuned Kaggle weights!
    model.load_state_dict(torch.load(weights_path, map_location=device, weights_only=True))
    model.to(device)
    model.eval() # Crucial for inference
    
    return model, device