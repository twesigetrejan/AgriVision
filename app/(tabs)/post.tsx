import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Image, StyleSheet, TouchableOpacity, ListRenderItem, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { User } from 'lucide-react-native';

// Type for Post
interface Post {
  id: string;
  userName: string;
  userProfileImage: string;
  postContent: string;
  imageUrl?: string | number;
  likes: number;
  comments: number;
  source?: string;
}

const PostPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<{ [key: string]: boolean }>({});
  const [loginButtonPressed, setLoginButtonPressed] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const storedPosts = await AsyncStorage.getItem('posts');
        if (storedPosts) {
          setPosts(JSON.parse(storedPosts));
        }
      } catch (error) {
        console.error('Failed to load posts:', error);
      }
    };

    const checkLoginStatus = async () => {
      const loggedIn = await AsyncStorage.getItem('loggedIn');
      setIsLoggedIn(loggedIn === 'true');

      if (loggedIn === 'true') {
        const username = await AsyncStorage.getItem('loggedInUser');
        const userProfileImage = await AsyncStorage.getItem(`${username}_profileImage`);
        setLoggedInUser(username);
        setProfileImage(userProfileImage);
      }
    };

    loadPosts();
    checkLoginStatus();
  }, []);

  const savePosts = async (posts: Post[]) => {
    try {
      await AsyncStorage.setItem('posts', JSON.stringify(posts));
    } catch (error) {
      console.error('Failed to save posts:', error);
    }
  };

  const toggleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
            ...post,
            likes: likedPosts[postId] ? post.likes - 1 : post.likes + 1
          }
          : post
      )
    );
    setLikedPosts(prevState => ({
      ...prevState,
      [postId]: !likedPosts[postId],
    }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0].uri;
      setSelectedImage(selectedImage);
    }
  };

  const handlePost = async () => {
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

    if (newPostContent.trim() === '') {
      Alert.alert('Error', 'Post content cannot be empty.');
      return;
    }

    if (!loggedInUser) {
      Alert.alert('Error', 'You must be logged in to post.');
      return;
    }

    const newPost: Post = {
      id: (posts.length + 1).toString(),
      userName: loggedInUser,
      userProfileImage: profileImage || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541',
      postContent: newPostContent,
      imageUrl: selectedImage || undefined,
      likes: 0,
      comments: 0,
    };

    console.log('New Post:', newPost); // Log the new post object

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    setNewPostContent('');
    setSelectedImage(null);
    await savePosts(updatedPosts);
  };

  const handleLoginLogout = async () => {
    if (isLoggedIn) {
      await AsyncStorage.removeItem('loggedIn');
      await AsyncStorage.removeItem('loggedInUser');
      await AsyncStorage.removeItem(`${loggedInUser}_profileImage`);
      setIsLoggedIn(false);
      setLoggedInUser(null);
      setProfileImage(null);
      router.replace('/');
    } else {
      router.replace('/');
    }
  };

  const renderPost: ListRenderItem<Post> = ({ item }) => {
    console.log('Rendering Post Image URL:', item.imageUrl);  // Log the imageUrl
    const renderImage = () => {
      if (item.imageUrl) {
        console.log('Rendering Image:', item.imageUrl);  // Log when the image is being rendered
        if (typeof item.imageUrl === 'string' && item.imageUrl.startsWith('http')) {
          return <Image source={{ uri: item.imageUrl }} style={styles.postImage} />;
        } else if (typeof item.imageUrl === 'number') {
          return <Image source={item.imageUrl} style={styles.postImage} />;
        } else {
          return <Image source={{ uri: item.imageUrl }} style={styles.postImage} />;
        }
      }
      return null;
    };

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image source={{ uri: item.userProfileImage }} style={styles.profileImage} />
          <Text style={styles.userName}>{item.userName}</Text>
        </View>
        {renderImage()}
        {item.source && (
          <Text style={styles.sourceText}>Source: {item.source}</Text>
        )}
        <Text style={styles.postContent}>{item.postContent}</Text>
        <View style={styles.interactionContainer}>
          <TouchableOpacity
            style={[
              styles.interactionButton,
              likedPosts[item.id] ? styles.likedButton : null
            ]}
            onPress={() => toggleLike(item.id)}
          >
            <Icon name="heart" size={18} color={likedPosts[item.id] ? "#FFFFFF" : "#4CAF50"} />
            <Text style={[styles.buttonText, { color: likedPosts[item.id] ? "#FFFFFF" : "#4CAF50" }]}>
              {item.likes}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionButton}>
            <Icon name="message-square" size={18} color="#4CAF50" />
            <Text style={styles.buttonText}>{item.comments}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.logo}>AgriVision</Text>
        <TouchableOpacity
          style={[
            styles.logButton,
            loginButtonPressed ? styles.loginButtonPressed : null
          ]}
          onPress={handleLoginLogout}
          onPressIn={() => setLoginButtonPressed(true)}
          onPressOut={() => setLoginButtonPressed(false)}
        >
          <User color="#FFFFFF" size={16} />
          <Text style={styles.loginText}>{isLoggedIn ? "Logout" : "Login"}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.postCreation}>
        <View style={styles.postInputContainer}>
          <TextInput
            style={styles.postInput}
            placeholder="Update AgriVision about Agriculture in your area"
            placeholderTextColor="#888888"
            multiline
            value={newPostContent}
            onChangeText={setNewPostContent}
          />
          <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
            <Icon name="image" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>
        <Button title="Post" color="#4CAF50" onPress={handlePost} />
      </View>
      <View style={styles.contentContainer}>
        <FlatList
          data={[...posts, dummyPost1, dummyPost2]}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
        />
      </View>
    </View>
  );
};

// Dummy posts to be added below actual posts
const dummyPost1: Post = {
  id: 'dummy1',
  userName: 'Twesige Trejan',
  userProfileImage: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541',
  postContent: 'New techniques in irrigation are changing the game.',
  imageUrl: require('../../assets/images/irri.jpg'),
  likes: 3,
  comments: 0,
  source: 'Agri Journal',
};

const dummyPost2: Post = {
  id: 'dummy2',
  userName: 'Haven Ella',
  userProfileImage: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541',
  postContent: 'This season’s best practices for sustainable farming.',
  imageUrl: require('../../assets/images/coffee.jpg'),
  likes: 7,
  comments: 2,
  source: 'Farmers Weekly',
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#e8f5e9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 60,

  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#388E3C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  loginButtonPressed: {
    backgroundColor: '#2E7D32',
  },
  loginText: {
    color: '#FFFFFF',
    marginLeft: 5,
  },
  postCreation: {
    padding: 10,
  },
  postInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#888888',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  postInput: {
    flex: 1,
    paddingHorizontal: 10,
    color: '#000000',
  },
  imagePickerButton: {
    padding: 10,
  },
  contentContainer: {
    flex: 1,
    padding: 10,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  postContent: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  interactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likedButton: {
    backgroundColor: '#4CAF50',
    padding: 5,
    borderRadius: 5,
  },
  buttonText: {
    marginLeft: 5,
  },
  sourceText: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 5,
  },
});

export default PostPage;
