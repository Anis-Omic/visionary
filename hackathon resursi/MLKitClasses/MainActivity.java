package beguna.mirza.mlkitexamples;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraX;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageAnalysisConfig;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.core.PreviewConfig;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.LifecycleOwner;
import android.content.pm.PackageManager;
import android.graphics.Matrix;
import android.media.Image;
import android.os.Bundle;
import android.util.Rational;
import android.util.Size;
import android.view.Surface;
import android.view.TextureView;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.Toast;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.ml.vision.FirebaseVision;
import com.google.firebase.ml.vision.common.FirebaseVisionImage;
import com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata;
import com.google.firebase.ml.vision.text.FirebaseVisionText;
import com.google.firebase.ml.vision.text.FirebaseVisionTextRecognizer;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    public static final String TAG = "Main Activity";
    private int REQUEST_CODE_PERMISSIONS = 101;
    private final String[] REQUIRED_PERMISSIONS = new String[]{"android.permission.CAMERA", "android.permission.WRITE_EXTERNAL_STORAGE"};
    TextureView textureView;
    ImageView imageView;
    GraphicOverlay graphicOverlay;
    private static int framesCounter = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        textureView = findViewById(R.id.textureView);
        graphicOverlay = findViewById(R.id.graphicOverlay);
        graphicOverlay.setCameraInfo(textureView.getWidth(),textureView.getHeight());

        if(allPermissionsGranted()){
            startCamera();
        }else{
            ActivityCompat.requestPermissions(this,REQUIRED_PERMISSIONS,REQUEST_CODE_PERMISSIONS);
        }

    }

    private boolean allPermissionsGranted(){

        for(String permission : REQUIRED_PERMISSIONS){
            if(ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED){
                return false;
            }
        }
        return true;

    }

    private void startCamera(){
        CameraX.unbindAll();
        Rational ascpetView = new Rational(textureView.getWidth(),textureView.getHeight());
        Size screen = new Size(textureView.getWidth(),textureView.getHeight());

        PreviewConfig previewConfig = new PreviewConfig.Builder().setTargetAspectRatio(ascpetView).setTargetResolution(screen).build();
        Preview preview = new Preview(previewConfig);
        preview.setOnPreviewOutputUpdateListener(new Preview.OnPreviewOutputUpdateListener() {
            @Override
            public void onUpdated(Preview.PreviewOutput output) {
                ViewGroup parent = (ViewGroup) textureView.getParent();
                parent.removeView(textureView);
                parent.addView(textureView,0);
                textureView.setSurfaceTexture(output.getSurfaceTexture());
                updateTransform();

            }
        });

        ImageAnalysisConfig imageAnalysisConfig = new ImageAnalysisConfig.Builder().
                setTargetResolution(screen).
                setImageReaderMode(ImageAnalysis.ImageReaderMode.ACQUIRE_LATEST_IMAGE).
                build();
        ImageAnalysis imageAnalysis = new ImageAnalysis(imageAnalysisConfig);
        imageAnalysis.setAnalyzer(new MyAnalyzer());

        //bind to lifecycle:
        CameraX.bindToLifecycle((LifecycleOwner)this, preview, imageAnalysis);
    }

    private void updateTransform(){
        Matrix mx = new Matrix();
        float w = textureView.getMeasuredWidth();
        float h = textureView.getMeasuredHeight();

        float cX = w / 2f;
        float cY = h / 2f;

        int rotationDgr;
        int rotation = (int)textureView.getRotation();

        switch(rotation){
            case Surface.ROTATION_0:
                rotationDgr = 0;
                break;
            case Surface.ROTATION_90:
                rotationDgr = 90;
                break;
            case Surface.ROTATION_180:
                rotationDgr = 180;
                break;
            case Surface.ROTATION_270:
                rotationDgr = 270;
                break;
            default:
                return;
        }

        mx.postRotate((float)rotationDgr, cX, cY);
        textureView.setTransform(mx);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {

        if(requestCode == REQUEST_CODE_PERMISSIONS){
            if(allPermissionsGranted()){
                startCamera();
            } else{
                Toast.makeText(this, "Permissions not granted by the user.", Toast.LENGTH_SHORT).show();
                finish();
            }
        }
    }

    private class MyAnalyzer implements ImageAnalysis.Analyzer {

        private int degreesToFirebaseRotation(int degrees) {
            switch (degrees) {
                case 0:
                    return FirebaseVisionImageMetadata.ROTATION_0;
                case 90:
                    return FirebaseVisionImageMetadata.ROTATION_90;
                case 180:
                    return FirebaseVisionImageMetadata.ROTATION_180;
                case 270:
                    return FirebaseVisionImageMetadata.ROTATION_270;
                default:
                    throw new IllegalArgumentException(
                            "Rotation must be 0, 90, 180, or 270.");
            }
        }

        @Override
        public void analyze(ImageProxy imageProxy, int degrees) {

            if (imageProxy == null || imageProxy.getImage() == null) {
                return;
            }
            int rotation = degreesToFirebaseRotation(degrees);
            if(framesCounter==50) {
                framesCounter = 0;
                Image mediaImage = imageProxy.getImage();
                FirebaseVisionImage image = FirebaseVisionImage.fromMediaImage(mediaImage, rotation);
                FirebaseVisionTextRecognizer textRecognizer = FirebaseVision.getInstance().getOnDeviceTextRecognizer();
                textRecognizer.processImage(image).
                        addOnSuccessListener(new OnSuccessListener<FirebaseVisionText>() {
                            @Override
                            public void onSuccess(FirebaseVisionText firebaseVisionText) {
                                List<FirebaseVisionText.TextBlock> blocks = firebaseVisionText.getTextBlocks();
                                graphicOverlay.clear();
                                if (blocks.size() == 0) {
                                    return;
                                }
                                for (int i = 0; i < blocks.size(); i++) {
                                    List<FirebaseVisionText.Line> lines = blocks.get(i).getLines();
                                    for (int j = 0; j < lines.size(); j++) {
                                        List<FirebaseVisionText.Element> elements = lines.get(j).getElements();
                                        for (int k = 0; k < elements.size(); k++) {
                                            GraphicOverlay.Graphic textGraphic = new TextGraphic(graphicOverlay, elements.get(k));
                                            graphicOverlay.add(textGraphic);

                                        }
                                    }
                                }
                            }
                        });
            }else {
                ++framesCounter;
            }
        }
    }

}


