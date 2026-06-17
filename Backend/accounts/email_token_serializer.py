from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        # Accept 'email' instead of 'username'
        attrs['username'] = attrs.get('email', '')
        return super().validate(attrs)
